/**
 * useLocalStaff
 *
 * Manages staff data in localStorage instead of the backend canister.
 * This is needed because addStaff/removeStaff/updateStaffTimes require
 * #admin permission on the backend, but the app uses anonymous identity.
 *
 * Storage key: "salonStaff"
 * Format: JSON array of SerializedStaff (bigints stored as strings)
 */

import { useCallback, useEffect, useState } from "react";
import type { Staff } from "../backend.d";

const STORAGE_KEY = "salonStaff";

// ── Extended Staff type with isPremium ─────────────────────────────────────────

export interface LocalStaff extends Staff {
  isPremium?: boolean;
}

// ── Serialization helpers ──────────────────────────────────────────────────────

interface SerializedTimeOfDay {
  hour: string;
  minute: string;
}

interface SerializedStaff {
  id: string;
  name: string;
  scheduledInTime: SerializedTimeOfDay;
  scheduledOutTime: SerializedTimeOfDay;
  isPremium?: boolean;
}

function deserializeStaff(s: SerializedStaff): LocalStaff {
  return {
    id: BigInt(s.id),
    name: s.name,
    scheduledInTime: {
      hour: BigInt(s.scheduledInTime.hour),
      minute: BigInt(s.scheduledInTime.minute),
    },
    scheduledOutTime: {
      hour: BigInt(s.scheduledOutTime.hour),
      minute: BigInt(s.scheduledOutTime.minute),
    },
    isPremium: s.isPremium ?? false,
  };
}

function serializeStaff(s: LocalStaff): SerializedStaff {
  return {
    id: String(s.id),
    name: s.name,
    scheduledInTime: {
      hour: String(s.scheduledInTime.hour),
      minute: String(s.scheduledInTime.minute),
    },
    scheduledOutTime: {
      hour: String(s.scheduledOutTime.hour),
      minute: String(s.scheduledOutTime.minute),
    },
    isPremium: s.isPremium ?? false,
  };
}

function readFromStorage(): LocalStaff[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: SerializedStaff[] = JSON.parse(raw);
    return parsed.map(deserializeStaff);
  } catch {
    return [];
  }
}

function writeToStorage(staffList: LocalStaff[]): void {
  const serialized = staffList.map(serializeStaff);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

function getNextId(staffList: LocalStaff[]): bigint {
  if (staffList.length === 0) return BigInt(1);
  const maxId = staffList.reduce(
    (max, s) => (s.id > max ? s.id : max),
    BigInt(0),
  );
  return maxId + BigInt(1);
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export interface AddStaffParams {
  name: string;
  inHour: number;
  inMinute: number;
  outHour: number;
  outMinute: number;
  isPremium?: boolean;
}

export interface UpdateStaffTimesParams {
  staffId: bigint;
  inHour: number;
  inMinute: number;
  outHour: number;
  outMinute: number;
}

export function useLocalStaff() {
  const [staff, setStaff] = useState<LocalStaff[]>(() => {
    const loaded = readFromStorage();
    // Sort by id ascending
    return [...loaded].sort((a, b) => (a.id < b.id ? -1 : 1));
  });

  // Keep staff in sync if another tab modifies localStorage
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const loaded = readFromStorage();
        setStaff([...loaded].sort((a, b) => (a.id < b.id ? -1 : 1)));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addStaff = useCallback(
    ({
      name,
      inHour,
      inMinute,
      outHour,
      outMinute,
      isPremium,
    }: AddStaffParams): LocalStaff => {
      const current = readFromStorage();
      const newStaff: LocalStaff = {
        id: getNextId(current),
        name: name.trim(),
        scheduledInTime: {
          hour: BigInt(inHour),
          minute: BigInt(inMinute),
        },
        scheduledOutTime: {
          hour: BigInt(outHour),
          minute: BigInt(outMinute),
        },
        isPremium: isPremium ?? false,
      };
      const updated = [...current, newStaff].sort((a, b) =>
        a.id < b.id ? -1 : 1,
      );
      writeToStorage(updated);
      setStaff(updated);
      return newStaff;
    },
    [],
  );

  const removeStaff = useCallback((staffId: bigint): void => {
    const current = readFromStorage();
    const updated = current
      .filter((s) => s.id !== staffId)
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    writeToStorage(updated);
    setStaff(updated);
  }, []);

  const updateStaffTimes = useCallback(
    ({
      staffId,
      inHour,
      inMinute,
      outHour,
      outMinute,
    }: UpdateStaffTimesParams): void => {
      const current = readFromStorage();
      const updated = current
        .map((s) => {
          if (s.id !== staffId) return s;
          return {
            ...s,
            scheduledInTime: {
              hour: BigInt(inHour),
              minute: BigInt(inMinute),
            },
            scheduledOutTime: {
              hour: BigInt(outHour),
              minute: BigInt(outMinute),
            },
          };
        })
        .sort((a, b) => (a.id < b.id ? -1 : 1));
      writeToStorage(updated);
      setStaff(updated);
    },
    [],
  );

  const togglePremium = useCallback((staffId: bigint): void => {
    const current = readFromStorage();
    const updated = current
      .map((s) => {
        if (s.id !== staffId) return s;
        return { ...s, isPremium: !s.isPremium };
      })
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    writeToStorage(updated);
    setStaff(updated);
  }, []);

  return {
    staff,
    isLoading: false,
    addStaff,
    removeStaff,
    updateStaffTimes,
    togglePremium,
  };
}
