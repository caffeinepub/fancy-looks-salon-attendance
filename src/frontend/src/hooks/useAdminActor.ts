/**
 * useAdminActor
 *
 * Provides an admin-authenticated actor for backend calls that require
 * #admin permission (addStaff, removeStaff, updateStaffTimes, etc.)
 *
 * The actor is initialized with the caffeineAdminToken secret parameter.
 * If the token is empty (non-admin user), admin calls will fail gracefully.
 */

import { useQuery } from "@tanstack/react-query";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";

export function useAdminActor() {
  const adminActorQuery = useQuery<backendInterface>({
    queryKey: ["adminActor"],
    queryFn: async () => {
      const token = getSecretParameter("caffeineAdminToken") || "";
      const actor = await createActorWithConfig();
      await actor._initializeAccessControlWithSecret(token);
      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  return {
    adminActor: adminActorQuery.data || null,
    isLoading: adminActorQuery.isLoading,
  };
}
