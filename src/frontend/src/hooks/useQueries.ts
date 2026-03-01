import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AttendanceRecord, Staff } from "../backend.d";
import { useActor } from "./useActor";

// ── Staff Queries ──────────────────────────────────────────────────────────────

export function useGetAllStaff() {
  const { actor, isFetching } = useActor();
  return useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStaff();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useAddStaff() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      inHour,
      inMinute,
      outHour,
      outMinute,
    }: {
      name: string;
      inHour: number;
      inMinute: number;
      outHour: number;
      outMinute: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addStaff(
        name,
        BigInt(inHour),
        BigInt(inMinute),
        BigInt(outHour),
        BigInt(outMinute),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useRemoveStaff() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (staffId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeStaff(staffId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useUpdateStaffTimes() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      inHour,
      inMinute,
      outHour,
      outMinute,
    }: {
      staffId: bigint;
      inHour: number;
      inMinute: number;
      outHour: number;
      outMinute: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateStaffTimes(
        staffId,
        BigInt(inHour),
        BigInt(inMinute),
        BigInt(outHour),
        BigInt(outMinute),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

// ── Attendance Cache Helpers ───────────────────────────────────────────────────

const ATTENDANCE_CACHE_KEY = "salonAttendanceCache_v2";

export function saveToAttendanceCache(
  staffId: bigint,
  date: string,
  record: AttendanceRecord,
) {
  try {
    const raw = localStorage.getItem(ATTENDANCE_CACHE_KEY) || "{}";
    const cache: Record<string, unknown> = JSON.parse(raw);
    cache[`${staffId}-${date}`] = serializeRecord(record);
    localStorage.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to save attendance cache", e);
  }
}

export function getFromAttendanceCache(
  staffId: bigint,
  date: string,
): AttendanceRecord | null {
  try {
    const raw = localStorage.getItem(ATTENDANCE_CACHE_KEY) || "{}";
    const cache: Record<string, unknown> = JSON.parse(raw);
    const entry = cache[`${staffId}-${date}`];
    if (!entry) return null;
    return deserializeRecord(entry as SerializedRecord);
  } catch {
    return null;
  }
}

export function getMonthlyAttendanceForStaff(
  staffId: bigint,
  year: number,
  month: number,
): Record<string, AttendanceRecord> {
  try {
    const raw = localStorage.getItem(ATTENDANCE_CACHE_KEY) || "{}";
    const cache: Record<string, unknown> = JSON.parse(raw);
    const prefix = `${staffId}-${year}-${String(month).padStart(2, "0")}`;
    const result: Record<string, AttendanceRecord> = {};
    for (const [key, val] of Object.entries(cache)) {
      if (key.startsWith(prefix)) {
        const date = key.replace(`${staffId}-`, "");
        result[date] = deserializeRecord(val as SerializedRecord);
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function getAllMonthlyAttendance(
  year: number,
  month: number,
): Record<string, Record<string, AttendanceRecord>> {
  try {
    const raw = localStorage.getItem(ATTENDANCE_CACHE_KEY) || "{}";
    const cache: Record<string, unknown> = JSON.parse(raw);
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const result: Record<string, Record<string, AttendanceRecord>> = {};
    for (const [key, val] of Object.entries(cache)) {
      const parts = key.split("-");
      // key format: staffId-YYYY-MM-DD
      if (parts.length >= 4) {
        const staffId = parts[0];
        const dateStr = parts.slice(1).join("-");
        if (dateStr.startsWith(monthStr)) {
          if (!result[staffId]) result[staffId] = {};
          result[staffId][dateStr] = deserializeRecord(val as SerializedRecord);
        }
      }
    }
    return result;
  } catch {
    return {};
  }
}

// ── Serialization helpers (store bigints as strings) ──────────────────────────

interface SerializedTimeOfDay {
  hour: string;
  minute: string;
}

interface SerializedRecord {
  isPresent: boolean;
  lateForIn: boolean;
  lateForOut: boolean;
  lateMinutesIn: string;
  lateMinutesOut: string;
  actualInTime: SerializedTimeOfDay | null;
  actualOutTime: SerializedTimeOfDay | null;
}

function serializeRecord(r: AttendanceRecord): SerializedRecord {
  return {
    isPresent: r.isPresent,
    lateForIn: r.lateForIn,
    lateForOut: r.lateForOut,
    lateMinutesIn: String(r.lateMinutesIn),
    lateMinutesOut: String(r.lateMinutesOut),
    actualInTime: r.actualInTime
      ? {
          hour: String(r.actualInTime.hour),
          minute: String(r.actualInTime.minute),
        }
      : null,
    actualOutTime: r.actualOutTime
      ? {
          hour: String(r.actualOutTime.hour),
          minute: String(r.actualOutTime.minute),
        }
      : null,
  };
}

function deserializeRecord(s: SerializedRecord): AttendanceRecord {
  const rec: AttendanceRecord = {
    isPresent: s.isPresent,
    lateForIn: s.lateForIn,
    lateForOut: s.lateForOut,
    lateMinutesIn: BigInt(s.lateMinutesIn || "0"),
    lateMinutesOut: BigInt(s.lateMinutesOut || "0"),
    date: "",
  };
  if (s.actualInTime) {
    rec.actualInTime = {
      hour: BigInt(s.actualInTime.hour),
      minute: BigInt(s.actualInTime.minute),
    };
  }
  if (s.actualOutTime) {
    rec.actualOutTime = {
      hour: BigInt(s.actualOutTime.hour),
      minute: BigInt(s.actualOutTime.minute),
    };
  }
  return rec;
}

// ── Local attendance logic (no backend calls) ─────────────────────────────────

function buildRecord(
  existing: AttendanceRecord | null,
  patch: Partial<{
    isPresent: boolean;
    inHour: number;
    inMinute: number;
    outHour: number;
    outMinute: number;
    scheduledInHour: number;
    scheduledInMinute: number;
    scheduledOutHour: number;
    scheduledOutMinute: number;
  }>,
): AttendanceRecord {
  const base: AttendanceRecord = existing || {
    isPresent: false,
    lateForIn: false,
    lateForOut: false,
    lateMinutesIn: BigInt(0),
    lateMinutesOut: BigInt(0),
    date: "",
  };

  let updated = { ...base };

  if (patch.isPresent !== undefined) {
    updated.isPresent = patch.isPresent;
  }

  if (
    patch.inHour !== undefined &&
    patch.inMinute !== undefined &&
    patch.scheduledInHour !== undefined &&
    patch.scheduledInMinute !== undefined
  ) {
    const actualMins = patch.inHour * 60 + patch.inMinute;
    const scheduledMins = patch.scheduledInHour * 60 + patch.scheduledInMinute;
    const late = actualMins > scheduledMins;
    updated.actualInTime = {
      hour: BigInt(patch.inHour),
      minute: BigInt(patch.inMinute),
    };
    updated.lateForIn = late;
    updated.lateMinutesIn = late
      ? BigInt(actualMins - scheduledMins)
      : BigInt(0);
    updated.isPresent = true;
  }

  if (
    patch.outHour !== undefined &&
    patch.outMinute !== undefined &&
    patch.scheduledOutHour !== undefined &&
    patch.scheduledOutMinute !== undefined
  ) {
    const actualMins = patch.outHour * 60 + patch.outMinute;
    const scheduledMins =
      patch.scheduledOutHour * 60 + patch.scheduledOutMinute;
    const late = actualMins < scheduledMins; // left early = late out
    updated.actualOutTime = {
      hour: BigInt(patch.outHour),
      minute: BigInt(patch.outMinute),
    };
    updated.lateForOut = late;
    updated.lateMinutesOut = late
      ? BigInt(scheduledMins - actualMins)
      : BigInt(0);
  }

  return updated;
}

// ── useMarkAttendance (localStorage only) ─────────────────────────────────────

export function useMarkAttendance() {
  return useMutation({
    mutationFn: async ({
      staffId,
      date,
      isPresent,
    }: {
      staffId: bigint;
      date: string;
      isPresent: boolean;
    }): Promise<AttendanceRecord> => {
      const existing = getFromAttendanceCache(staffId, date);
      const record = buildRecord(existing, { isPresent });
      saveToAttendanceCache(staffId, date, record);
      return record;
    },
  });
}

// ── useSubmitInTime (localStorage only) ───────────────────────────────────────

export function useSubmitInTime() {
  return useMutation({
    mutationFn: async ({
      staffId,
      date,
      hour,
      minute,
      scheduledInHour,
      scheduledInMinute,
    }: {
      staffId: bigint;
      date: string;
      hour: number;
      minute: number;
      scheduledInHour: number;
      scheduledInMinute: number;
    }): Promise<AttendanceRecord> => {
      const existing = getFromAttendanceCache(staffId, date);
      const record = buildRecord(existing, {
        inHour: hour,
        inMinute: minute,
        scheduledInHour,
        scheduledInMinute,
      });
      saveToAttendanceCache(staffId, date, record);
      return record;
    },
  });
}

// ── useSubmitOutTime (localStorage only) ──────────────────────────────────────

export function useSubmitOutTime() {
  return useMutation({
    mutationFn: async ({
      staffId,
      date,
      hour,
      minute,
      scheduledOutHour,
      scheduledOutMinute,
    }: {
      staffId: bigint;
      date: string;
      hour: number;
      minute: number;
      scheduledOutHour: number;
      scheduledOutMinute: number;
    }): Promise<AttendanceRecord> => {
      const existing = getFromAttendanceCache(staffId, date);
      const record = buildRecord(existing, {
        outHour: hour,
        outMinute: minute,
        scheduledOutHour,
        scheduledOutMinute,
      });
      saveToAttendanceCache(staffId, date, record);
      return record;
    },
  });
}
