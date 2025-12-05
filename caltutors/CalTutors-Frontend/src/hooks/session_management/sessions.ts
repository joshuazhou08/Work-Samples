import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "@/services/session_management";
import type {
  Session,
  CreateSessionData,
  UpdateSessionData,
  SessionStats,
  SessionFilters,
  AvailableStudents,
} from "@/types/session_management";
import { sessionKeys } from "./keys";

export function useSessions(filters?: SessionFilters) {
  return useQuery({
    queryKey: sessionKeys.list(filters),
    queryFn: () => sessionService.getSessions(filters),
  });
}

export function useSession(sessionId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => sessionService.getSession(sessionId),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionData: CreateSessionData) =>
      sessionService.createSession(sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.upcomingSessions(),
      });
      queryClient.invalidateQueries({ queryKey: sessionKeys.sessionStats() });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      sessionData,
    }: {
      sessionId: number;
      sessionData: CreateSessionData;
    }) => sessionService.updateSession(sessionId, sessionData),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.upcomingSessions(),
      });
      queryClient.invalidateQueries({ queryKey: sessionKeys.sessionStats() });
    },
  });
}

export function usePatchSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      sessionData,
    }: {
      sessionId: number;
      sessionData: UpdateSessionData;
    }) => sessionService.patchSession(sessionId, sessionData),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.upcomingSessions(),
      });
      queryClient.invalidateQueries({ queryKey: sessionKeys.sessionStats() });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => sessionService.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.upcomingSessions(),
      });
      queryClient.invalidateQueries({ queryKey: sessionKeys.sessionStats() });
    },
  });
}

export function useUpcomingSessions() {
  return useQuery({
    queryKey: sessionKeys.upcomingSessions(),
    queryFn: () => sessionService.getUpcomingSessions(),
  });
}

export function useSessionStats() {
  return useQuery({
    queryKey: sessionKeys.sessionStats(),
    queryFn: () => sessionService.getSessionStats(),
  });
}

export function useAvailableStudents() {
  return useQuery({
    queryKey: sessionKeys.availableStudents(),
    queryFn: () => sessionService.getAvailableStudents(),
  });
}
