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

// ── Attendance Mutations ───────────────────────────────────────────────────────

export function useMarkAttendance() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not connected");
      const record = await actor.markAttendance(staffId, date, isPresent);
      // Cache in localStorage
      saveToAttendanceCache(staffId, date, record);
      return record;
    },
  });
}

export function useSubmitInTime() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not connected");
      const record = await actor.submitInTime(
        staffId,
        date,
        BigInt(hour),
        BigInt(minute),
      );
      saveToAttendanceCache(staffId, date, record);
      return record;
    },
  });
}

export function useSubmitOutTime() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not connected");
      const record = await actor.submitOutTime(
        staffId,
        date,
        BigInt(hour),
        BigInt(minute),
      );
      saveToAttendanceCache(staffId, date, record);
      return record;
    },
  });
}

// ── Attendance Cache Helpers ───────────────────────────────────────────────────

export function saveToAttendanceCache(
  staffId: bigint,
  date: string,
  record: AttendanceRecord,
) {
  const raw = localStorage.getItem("attendanceCache") || "{}";
  const cache: Record<string, AttendanceRecord> = JSON.parse(raw);
  cache[`${staffId}-${date}`] = record;
  localStorage.setItem("attendanceCache", JSON.stringify(cache));
}

export function getFromAttendanceCache(
  staffId: bigint,
  date: string,
): AttendanceRecord | null {
  const raw = localStorage.getItem("attendanceCache") || "{}";
  const cache: Record<string, AttendanceRecord> = JSON.parse(raw);
  return cache[`${staffId}-${date}`] || null;
}

export function getMonthlyAttendanceForStaff(
  staffId: bigint,
  year: number,
  month: number,
): Record<string, AttendanceRecord> {
  const raw = localStorage.getItem("attendanceCache") || "{}";
  const cache: Record<string, AttendanceRecord> = JSON.parse(raw);
  const prefix = `${staffId}-${year}-${String(month).padStart(2, "0")}`;
  const result: Record<string, AttendanceRecord> = {};
  for (const [key, val] of Object.entries(cache)) {
    if (key.startsWith(prefix)) {
      const date = key.replace(`${staffId}-`, "");
      result[date] = val;
    }
  }
  return result;
}

export function getAllMonthlyAttendance(
  year: number,
  month: number,
): Record<string, Record<string, AttendanceRecord>> {
  const raw = localStorage.getItem("attendanceCache") || "{}";
  const cache: Record<string, AttendanceRecord> = JSON.parse(raw);
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  // keyed by staffId
  const result: Record<string, Record<string, AttendanceRecord>> = {};
  for (const [key, val] of Object.entries(cache)) {
    const parts = key.split("-");
    // key format: staffId-YYYY-MM-DD
    if (parts.length >= 4) {
      const staffId = parts[0];
      const dateStr = parts.slice(1).join("-");
      if (dateStr.startsWith(monthStr)) {
        if (!result[staffId]) result[staffId] = {};
        result[staffId][dateStr] = val;
      }
    }
  }
  return result;
}
