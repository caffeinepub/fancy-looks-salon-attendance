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

// ── Attendance Cache Helpers (localStorage write-through cache) ───────────────

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
    const serialized = JSON.stringify(cache);
    JSON.parse(serialized);
    localStorage.setItem(ATTENDANCE_CACHE_KEY, serialized);
  } catch (e) {
    console.error(
      "Failed to save attendance cache — existing data preserved",
      e,
    );
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
  try {
    const rec: AttendanceRecord = {
      isPresent: Boolean(s.isPresent),
      lateForIn: Boolean(s.lateForIn),
      lateForOut: Boolean(s.lateForOut),
      lateMinutesIn: BigInt(s.lateMinutesIn || "0"),
      lateMinutesOut: BigInt(s.lateMinutesOut || "0"),
      date: "",
    };
    if (s.actualInTime) {
      rec.actualInTime = {
        hour: BigInt(s.actualInTime.hour || "0"),
        minute: BigInt(s.actualInTime.minute || "0"),
      };
    }
    if (s.actualOutTime) {
      rec.actualOutTime = {
        hour: BigInt(s.actualOutTime.hour || "0"),
        minute: BigInt(s.actualOutTime.minute || "0"),
      };
    }
    return rec;
  } catch (e) {
    console.error("Failed to deserialize attendance record, using fallback", e);
    return {
      isPresent: false,
      lateForIn: false,
      lateForOut: false,
      lateMinutesIn: BigInt(0),
      lateMinutesOut: BigInt(0),
      date: "",
    };
  }
}

// ── deleteAttendanceRecord (for explicit admin deletion only) ─────────────────

export function deleteAttendanceRecord(staffId: bigint, date: string): void {
  try {
    const raw = localStorage.getItem(ATTENDANCE_CACHE_KEY) || "{}";
    const cache: Record<string, unknown> = JSON.parse(raw);
    const key = `${staffId}-${date}`;
    if (key in cache) {
      delete cache[key];
      localStorage.setItem(ATTENDANCE_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    console.error("Failed to delete attendance record", e);
  }
}

// ── Backend Attendance Queries ─────────────────────────────────────────────────

/**
 * Fetches a single attendance record for a staff member on a given date.
 * Query key: ["attendance", staffIdStr, date]
 */
export function useGetAttendance(staffId: bigint | null, date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord | null>({
    queryKey: ["attendance", staffId != null ? staffId.toString() : null, date],
    queryFn: async () => {
      if (!actor || staffId == null) return null;
      try {
        const result = await actor.getAttendance(staffId, date);
        // Write-through to localStorage cache
        if (result) {
          saveToAttendanceCache(staffId, date, result);
        }
        return result;
      } catch (err) {
        console.error("getAttendance failed, using cache fallback", err);
        return getFromAttendanceCache(staffId, date);
      }
    },
    enabled: !!actor && !isFetching && staffId != null && date.length > 0,
    staleTime: 15_000,
  });
}

/**
 * Fetches all attendance records for a staff member for a given month.
 * yearMonth format: "YYYY-MM"
 * Query key: ["attendance", "monthly", staffIdStr, yearMonth]
 */
export function useGetMonthlyAttendanceForStaff(
  staffId: bigint | null,
  yearMonth: string,
) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: [
      "attendance",
      "monthly",
      staffId != null ? staffId.toString() : null,
      yearMonth,
    ],
    queryFn: async () => {
      if (!actor || staffId == null) return [];
      try {
        const records = await actor.getMonthlyAttendanceForStaff(
          staffId,
          yearMonth,
        );
        // Write-through to localStorage cache
        for (const r of records) {
          if (r.date) {
            saveToAttendanceCache(staffId, r.date, r);
          }
        }
        return records;
      } catch (err) {
        console.error(
          "getMonthlyAttendanceForStaff failed, no fallback available",
          err,
        );
        return [];
      }
    },
    enabled: !!actor && !isFetching && staffId != null && yearMonth.length > 0,
    staleTime: 30_000,
  });
}

/**
 * Fetches all staff attendance for a given month.
 * yearMonth format: "YYYY-MM"
 * Returns array of [staffId, AttendanceRecord[]] tuples.
 * Query key: ["attendance", "allMonthly", yearMonth]
 */
export function useGetAllMonthlyAttendance(yearMonth: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, AttendanceRecord[]]>>({
    queryKey: ["attendance", "allMonthly", yearMonth],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getAllMonthlyAttendance(yearMonth);
        // Write-through to localStorage cache
        for (const [sid, records] of result) {
          for (const r of records) {
            if (r.date) {
              saveToAttendanceCache(sid, r.date, r);
            }
          }
        }
        return result;
      } catch (err) {
        console.error(
          "getAllMonthlyAttendance failed, no fallback available",
          err,
        );
        return [];
      }
    },
    enabled: !!actor && !isFetching && yearMonth.length > 0,
    staleTime: 30_000,
  });
}

// ── useMarkAttendance (backend via regular actor - no permission check needed) ──

export function useMarkAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
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
      if (!actor) throw new Error("Actor not ready");
      const record = await actor.markAttendance(staffId, date, isPresent);
      // Write-through to localStorage cache
      saveToAttendanceCache(staffId, date, record);
      return record;
    },
    onSuccess: (_data, variables) => {
      const { staffId, date } = variables;
      // Invalidate the specific attendance record
      qc.invalidateQueries({
        queryKey: ["attendance", staffId.toString(), date],
      });
      // Invalidate monthly data for this staff for the month
      const yearMonth = date.slice(0, 7); // "YYYY-MM"
      qc.invalidateQueries({
        queryKey: ["attendance", "monthly", staffId.toString(), yearMonth],
      });
      // Invalidate all-monthly for that month
      qc.invalidateQueries({
        queryKey: ["attendance", "allMonthly", yearMonth],
      });
    },
  });
}

// ── useSubmitInTime (backend via anonymous actor) ──────────────────────────────

export function useSubmitInTime() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      date,
      hour,
      minute,
    }: {
      staffId: bigint;
      date: string;
      hour: number;
      minute: number;
    }): Promise<AttendanceRecord> => {
      if (!actor) throw new Error("Actor not ready");
      const record = await actor.submitInTime(
        staffId,
        date,
        BigInt(hour),
        BigInt(minute),
      );
      // Write-through to localStorage cache
      saveToAttendanceCache(staffId, date, record);
      return record;
    },
    onSuccess: (_data, variables) => {
      const { staffId, date } = variables;
      qc.invalidateQueries({
        queryKey: ["attendance", staffId.toString(), date],
      });
      const yearMonth = date.slice(0, 7);
      qc.invalidateQueries({
        queryKey: ["attendance", "monthly", staffId.toString(), yearMonth],
      });
      qc.invalidateQueries({
        queryKey: ["attendance", "allMonthly", yearMonth],
      });
    },
  });
}

// ── useSubmitOutTime (backend via anonymous actor) ─────────────────────────────

export function useSubmitOutTime() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      date,
      hour,
      minute,
    }: {
      staffId: bigint;
      date: string;
      hour: number;
      minute: number;
    }): Promise<AttendanceRecord> => {
      if (!actor) throw new Error("Actor not ready");
      const record = await actor.submitOutTime(
        staffId,
        date,
        BigInt(hour),
        BigInt(minute),
      );
      // Write-through to localStorage cache
      saveToAttendanceCache(staffId, date, record);
      return record;
    },
    onSuccess: (_data, variables) => {
      const { staffId, date } = variables;
      qc.invalidateQueries({
        queryKey: ["attendance", staffId.toString(), date],
      });
      const yearMonth = date.slice(0, 7);
      qc.invalidateQueries({
        queryKey: ["attendance", "monthly", staffId.toString(), yearMonth],
      });
      qc.invalidateQueries({
        queryKey: ["attendance", "allMonthly", yearMonth],
      });
    },
  });
}
