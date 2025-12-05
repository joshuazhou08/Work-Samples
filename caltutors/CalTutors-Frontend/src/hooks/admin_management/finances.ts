import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { chargeService } from "@/services/admin_management";
import { adminKeys } from "./keys";
import type {
  TutorPayment,
  Charge,
  ChargeFilters,
  CreateChargeData,
  UpdateChargeData,
  UnchargedSessionGroup,
  FinanceStats,
} from "@/types/admin_management";

// ===== TUTOR PAYMENTS =====

/**
 * Hook for fetching tutor payments with optional date filtering
 * Date filtering is now done on the backend
 */
export function useTutorPayments(
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<TutorPayment[], Error> {
  return useQuery({
    queryKey: adminKeys.tutorPayments(startDate, endDate),
    queryFn: () => chargeService.getTutorPayments(startDate, endDate),
    enabled: options?.enabled ?? true,
  });
}

// ===== CHARGES =====

/**
 * Hook for fetching all charges with optional filtering (Admin only)
 */
export function useAdminCharges(
  filters?: ChargeFilters,
  options?: { enabled?: boolean }
): UseQueryResult<Charge[], Error> {
  return useQuery({
    queryKey: adminKeys.charges(filters),
    queryFn: () => chargeService.getCharges(filters),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook for fetching a single charge by ID (Admin only)
 */
export function useAdminCharge(
  chargeId: number,
  options?: { enabled?: boolean }
): UseQueryResult<Charge, Error> {
  return useQuery({
    queryKey: adminKeys.charge(chargeId),
    queryFn: () => chargeService.getCharge(chargeId),
    enabled: (options?.enabled ?? true) && !!chargeId,
  });
}

/**
 * Hook for creating a new charge (Admin only)
 */
export function useCreateAdminCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chargeData: CreateChargeData) =>
      chargeService.createCharge(chargeData),
    onSuccess: (newCharge) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.charges() });
      queryClient.setQueryData(adminKeys.charge(newCharge.id), newCharge);
    },
  });
}

/**
 * Hook for updating a charge (Admin only)
 */
export function useUpdateAdminCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chargeId,
      chargeData,
    }: {
      chargeId: number;
      chargeData: UpdateChargeData;
    }) => chargeService.updateCharge(chargeId, chargeData),
    onSuccess: (updatedCharge, { chargeId }) => {
      queryClient.setQueryData(adminKeys.charge(chargeId), updatedCharge);
      queryClient.invalidateQueries({ queryKey: adminKeys.charges() });
    },
  });
}

/**
 * Hook for deleting a charge (Admin only)
 */
export function useDeleteAdminCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chargeId: number) => chargeService.deleteCharge(chargeId),
    onSuccess: (_, chargeId) => {
      queryClient.removeQueries({ queryKey: adminKeys.charge(chargeId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.charges() });
    },
  });
}

// ===== UNCHARGED SESSIONS =====

/**
 * Hook for fetching uncharged sessions grouped by student (Admin only)
 */
export function useUnchargedSessions(options?: {
  enabled?: boolean;
}): UseQueryResult<UnchargedSessionGroup[], Error> {
  return useQuery({
    queryKey: adminKeys.unchargedSessions(),
    queryFn: () => chargeService.getUnchargedSessions(),
    enabled: options?.enabled ?? true,
  });
}

// ===== FINANCE STATS =====

/**
 * Hook for fetching overall finance statistics (Admin only)
 */
export function useFinanceStats(
  startDate: string,
  endDate: string,
  options?: { enabled?: boolean }
): UseQueryResult<FinanceStats, Error> {
  return useQuery({
    queryKey: adminKeys.financeStats(startDate, endDate),
    queryFn: () => chargeService.getFinanceStats(startDate, endDate),
    enabled: options?.enabled ?? true,
  });
}
