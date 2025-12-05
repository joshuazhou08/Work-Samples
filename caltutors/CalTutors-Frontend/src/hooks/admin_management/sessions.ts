import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { sessionService } from "@/services/admin_management/sessions";
import { adminKeys } from "./keys";
import type { SessionStats } from "@/types/admin_management";

/**
 * Hook for fetching session statistics (Admin only)
 */
export function useSessionStats(
  startDate: string,
  endDate: string,
  options?: { enabled?: boolean }
): UseQueryResult<SessionStats, Error> {
  return useQuery({
    queryKey: adminKeys.sessionStats(startDate, endDate),
    queryFn: () => sessionService.getSessionStats(startDate, endDate),
    enabled: options?.enabled ?? true,
  });
}
