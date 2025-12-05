import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rateService } from "@/services/session_management";
import type { Rate, CreateRateData } from "@/types/session_management";
import { sessionKeys } from "./keys";

export function useAllRates(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: sessionKeys.rates(),
    queryFn: () => rateService.getAllRates(),
    enabled: options?.enabled,
  });
}

export function useStudentRates(studentId: number) {
  return useQuery({
    queryKey: sessionKeys.studentRates(studentId),
    queryFn: () => rateService.getStudentRates(studentId),
    enabled: !!studentId,
  });
}

export function useTutorRates(tutorId: number) {
  return useQuery({
    queryKey: sessionKeys.tutorRates(tutorId),
    queryFn: () => rateService.getTutorRates(tutorId),
    enabled: !!tutorId,
  });
}

export function useCreateRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rateData: CreateRateData) => rateService.createRate(rateData),
    onSuccess: (newRate) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.rates() });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.studentRates(newRate.student),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.tutorRates(newRate.tutor),
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
      queryClient.invalidateQueries({ queryKey: sessionKeys.rates() });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.studentRates(updatedRate.student),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.tutorRates(updatedRate.tutor),
      });
    },
  });
}

export function useDeleteRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rateId: number) => rateService.deleteRate(rateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.rates() });
    },
  });
}
