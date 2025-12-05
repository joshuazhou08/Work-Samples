import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rateService } from "@/services/session_management";
import type { CreateRateData } from "@/types/session_management";
import { adminKeys } from "./keys";

export function useAllRates(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.rates(),
    queryFn: () => rateService.getAllRates(),
    enabled: options?.enabled,
  });
}

export function useStudentRates(studentId: number) {
  return useQuery({
    queryKey: adminKeys.studentRates(studentId),
    queryFn: () => rateService.getStudentRates(studentId),
    enabled: !!studentId,
  });
}

export function useTutorRates(tutorId: number) {
  return useQuery({
    queryKey: adminKeys.tutorRates(tutorId),
    queryFn: () => rateService.getTutorRates(tutorId),
    enabled: !!tutorId,
  });
}

export function useCreateRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rateData: CreateRateData) => rateService.createRate(rateData),
    onSuccess: (newRate) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.rates(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.studentRates(newRate.student),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.tutorRates(newRate.tutor),
      });
    },
  });
}

export function useUpdateRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      rateId,
      rateData,
    }: {
      rateId: number;
      rateData: Partial<CreateRateData>;
    }) => rateService.updateRate(rateId, rateData),
    onSuccess: (updatedRate) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.rates(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.studentRates(updatedRate.student),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.tutorRates(updatedRate.tutor),
      });
    },
  });
}

export function useDeleteRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rateId: number) => rateService.deleteRate(rateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.rates(),
      });
    },
  });
}
