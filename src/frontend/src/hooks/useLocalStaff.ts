/**
 * useLocalStaff
 *
 * Manages staff data via the backend canister (cross-device sync).
 * - READ: Uses anonymous actor to call getAllStaff() — works on any device
 * - WRITE: Uses regular actor (backend has no permission checks on staff management)
 * - isPremium: localStorage only (backend Staff type has no isPremium field)
 *
 * Premium storage key: "salonStaffPremium_v2"
 * Format: JSON object — { [staffIdAsString]: boolean }
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Staff } from "../backend.d";
import { useActor } from "./useActor";

// ── Extended Staff type with isPremium ──────────────────────────────────────────

export interface LocalStaff extends Staff {
  isPremium?: boolean;
}

// ── Premium localStorage helpers ───────────────────────────────────────────────

const PREMIUM_STORAGE_KEY = "salonStaffPremium_v2";

function getPremiumMap(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(PREMIUM_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setPremiumMap(map: Record<string, boolean>) {
  localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(map));
}

// ── Exported param interfaces ──────────────────────────────────────────────────

export interface AddStaffParams {
  name: string;
  inHour: number;
  inMinute: number;
  outHour: number;
  outMinute: number;
}

export interface UpdateStaffTimesParams {
  staffId: bigint;
  inHour: number;
  inMinute: number;
  outHour: number;
  outMinute: number;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useLocalStaff() {
  const { actor, isFetching: isActorFetching } = useActor();
  const queryClient = useQueryClient();

  // Track premium map in local state so togglePremium triggers re-renders
  const [premiumMap, setPremiumMapState] = useState<Record<string, boolean>>(
    () => getPremiumMap(),
  );

  // ── Read staff from backend ────────────────────────────────────────────────

  const staffQuery = useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getAllStaff();
        return result;
      } catch (err) {
        console.error("Failed to fetch staff from backend", err);
        return [];
      }
    },
    enabled: !!actor && !isActorFetching,
    staleTime: 30_000,
  });

  // Merge backend staff with localStorage premium flags, sorted by id
  const staff: LocalStaff[] = (staffQuery.data ?? [])
    .map((s) => ({
      ...s,
      isPremium: premiumMap[String(s.id)] ?? false,
    }))
    .sort((a, b) => (a.id < b.id ? -1 : 1));

  // ── Mutations (admin actor required) ──────────────────────────────────────

  const addStaffMutation = useMutation({
    mutationFn: async ({
      name,
      inHour,
      inMinute,
      outHour,
      outMinute,
    }: AddStaffParams) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addStaff(
        name,
        BigInt(inHour),
        BigInt(inMinute),
        BigInt(outHour),
        BigInt(outMinute),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const removeStaffMutation = useMutation({
    mutationFn: async (staffId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.removeStaff(staffId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const updateStaffTimesMutation = useMutation({
    mutationFn: async ({
      staffId,
      inHour,
      inMinute,
      outHour,
      outMinute,
    }: UpdateStaffTimesParams) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateStaffTimes(
        staffId,
        BigInt(inHour),
        BigInt(inMinute),
        BigInt(outHour),
        BigInt(outMinute),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  // ── togglePremium (localStorage only, no backend call) ────────────────────

  const togglePremium = (staffId: bigint): void => {
    const key = String(staffId);
    const current = getPremiumMap();
    const updated = { ...current, [key]: !current[key] };
    setPremiumMap(updated);
    setPremiumMapState(updated);
  };

  // ── Wrapped action helpers ────────────────────────────────────────────────

  const addStaff = async (params: AddStaffParams): Promise<void> => {
    await addStaffMutation.mutateAsync(params);
  };

  const removeStaff = async (staffId: bigint): Promise<void> => {
    await removeStaffMutation.mutateAsync(staffId);
  };

  const updateStaffTimes = async (
    params: UpdateStaffTimesParams,
  ): Promise<void> => {
    await updateStaffTimesMutation.mutateAsync(params);
  };

  return {
    staff,
    isLoading: staffQuery.isLoading || isActorFetching,
    addStaff,
    removeStaff,
    updateStaffTimes,
    togglePremium,
    isAddingStaff: addStaffMutation.isPending,
    isRemovingStaff: removeStaffMutation.isPending,
    isUpdatingStaff: updateStaffTimesMutation.isPending,
  };
}
