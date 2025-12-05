import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useSessions,
  useSession,
  useCreateSession,
  useUpdateSession,
  usePatchSession,
  useDeleteSession,
  useUpcomingSessions,
  useSessionStats,
  useAvailableStudents,
} from "../sessions";
import { sessionService } from "@/services/session_management";
import { sessionKeys } from "../keys";

jest.mock("@/services/session_management");

const mockSessionService = sessionService as jest.Mocked<typeof sessionService>;

describe("sessions hooks", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useSessions", () => {
    it("calls the correct service method without filters", async () => {
      const mockSessions = [{ id: 1, duration_minutes: 60 }];
      mockSessionService.getSessions.mockResolvedValue(mockSessions as any);

      renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSessionService.getSessions).toHaveBeenCalledWith(undefined);
      });
    });

    it("calls the correct service method with filters", async () => {
      const mockSessions = [{ id: 1, duration_minutes: 60 }];
      mockSessionService.getSessions.mockResolvedValue(mockSessions as any);

      const filters = { tutor_id: 5 };
      renderHook(() => useSessions(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSessionService.getSessions).toHaveBeenCalledWith(filters);
      });
    });

    it("uses the correct query key", () => {
      mockSessionService.getSessions.mockResolvedValue([]);

      const { result } = renderHook(() => useSessions(), {
        wrapper: createWrapper(),
      });

      const queryKey = sessionKeys.list();
      expect(queryClient.getQueryState(queryKey)).toBeDefined();
    });
  });

  describe("useSession", () => {
    it("calls the correct service method", async () => {
      const mockSession = { id: 10, duration_minutes: 90 };
      mockSessionService.getSession.mockResolvedValue(mockSession as any);

      renderHook(() => useSession(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSessionService.getSession).toHaveBeenCalledWith(10);
      });
    });

    it("uses the correct query key", () => {
      mockSessionService.getSession.mockResolvedValue({} as any);

      const { result } = renderHook(() => useSession(10), {
        wrapper: createWrapper(),
      });

      const queryKey = sessionKeys.detail(10);
      expect(queryClient.getQueryState(queryKey)).toBeDefined();
    });

    it("respects enabled option when false", () => {
      mockSessionService.getSession.mockResolvedValue({} as any);

      const { result } = renderHook(() => useSession(10, { enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockSessionService.getSession).not.toHaveBeenCalled();
    });

    it("is enabled by default", async () => {
      mockSessionService.getSession.mockResolvedValue({} as any);

      renderHook(() => useSession(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSessionService.getSession).toHaveBeenCalled();
      });
    });
  });

  describe("useCreateSession", () => {
    it("invalidates the correct query keys on success", async () => {
      const mockNewSession = {
        id: 1,
        student: 5,
        tutor: 3,
        duration_minutes: 60,
      };

      mockSessionService.createSession.mockResolvedValue(mockNewSession as any);

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateSession(), { wrapper });

      await result.current.mutateAsync({
        student: 5,
        tutor: 3,
        start_time: "2025-10-24T10:00:00Z",
        duration_minutes: 60,
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.list(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.upcomingSessions(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.sessionStats(),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);
    });

    it("calls the correct service method", async () => {
      mockSessionService.createSession.mockResolvedValue({} as any);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(),
      });

      const sessionData = {
        student: 5,
        tutor: 3,
        start_time: "2025-10-24T10:00:00Z",
        duration_minutes: 60,
      };

      await result.current.mutateAsync(sessionData);

      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        sessionData
      );
    });
  });

  describe("useUpdateSession", () => {
    it("invalidates the correct query keys on success", async () => {
      const mockUpdatedSession = {
        id: 1,
        student: 5,
        tutor: 3,
        duration_minutes: 90,
      };

      mockSessionService.updateSession.mockResolvedValue(
        mockUpdatedSession as any
      );

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateSession(), { wrapper });

      await result.current.mutateAsync({
        sessionId: 1,
        sessionData: {
          student: 5,
          tutor: 3,
          start_time: "2025-10-24T10:00:00Z",
          duration_minutes: 90,
        },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.list(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.detail(1),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.upcomingSessions(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.sessionStats(),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(4);
    });

    it("calls the correct service method", async () => {
      mockSessionService.updateSession.mockResolvedValue({} as any);

      const { result } = renderHook(() => useUpdateSession(), {
        wrapper: createWrapper(),
      });

      const sessionData = {
        student: 5,
        tutor: 3,
        start_time: "2025-10-24T10:00:00Z",
        duration_minutes: 90,
      };

      await result.current.mutateAsync({
        sessionId: 1,
        sessionData,
      });

      expect(mockSessionService.updateSession).toHaveBeenCalledWith(
        1,
        sessionData
      );
    });
  });

  describe("usePatchSession", () => {
    it("invalidates the correct query keys on success", async () => {
      const mockPatchedSession = {
        id: 1,
        duration_minutes: 120,
      };

      mockSessionService.patchSession.mockResolvedValue(
        mockPatchedSession as any
      );

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => usePatchSession(), { wrapper });

      await result.current.mutateAsync({
        sessionId: 1,
        sessionData: { duration_minutes: 120 },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.list(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.detail(1),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.upcomingSessions(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.sessionStats(),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(4);
    });

    it("calls the correct service method", async () => {
      mockSessionService.patchSession.mockResolvedValue({} as any);

      const { result } = renderHook(() => usePatchSession(), {
        wrapper: createWrapper(),
      });

      const patchData = { duration_minutes: 120 };

      await result.current.mutateAsync({
        sessionId: 1,
        sessionData: patchData,
      });

      expect(mockSessionService.patchSession).toHaveBeenCalledWith(
        1,
        patchData
      );
    });
  });

  describe("useDeleteSession", () => {
    it("invalidates the correct query keys on success", async () => {
      mockSessionService.deleteSession.mockResolvedValue(undefined as any);

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteSession(), { wrapper });

      await result.current.mutateAsync(1);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.list(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.upcomingSessions(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.sessionStats(),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);
    });

    it("calls the correct service method", async () => {
      mockSessionService.deleteSession.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useDeleteSession(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(1);

      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(1);
    });
  });

  describe("useUpcomingSessions", () => {
    it("calls the correct service method", async () => {
      const mockSessions = [{ id: 1 }];
      mockSessionService.getUpcomingSessions.mockResolvedValue(
        mockSessions as any
      );

      renderHook(() => useUpcomingSessions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSessionService.getUpcomingSessions).toHaveBeenCalled();
      });
    });

    it("uses the correct query key", () => {
      mockSessionService.getUpcomingSessions.mockResolvedValue([]);

      const { result } = renderHook(() => useUpcomingSessions(), {
        wrapper: createWrapper(),
      });

      const queryKey = sessionKeys.upcomingSessions();
      expect(queryClient.getQueryState(queryKey)).toBeDefined();
    });
  });

  describe("useSessionStats", () => {
    it("calls the correct service method", async () => {
      const mockStats = {
        total_sessions: 10,
        upcoming_sessions: 5,
        past_sessions: 5,
        total_hours: 15.5,
        sessions_as_student: 10,
        sessions_as_tutor: 0,
      };
      mockSessionService.getSessionStats.mockResolvedValue(mockStats);

      renderHook(() => useSessionStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSessionService.getSessionStats).toHaveBeenCalled();
      });
    });

    it("uses the correct query key", () => {
      mockSessionService.getSessionStats.mockResolvedValue({} as any);

      const { result } = renderHook(() => useSessionStats(), {
        wrapper: createWrapper(),
      });

      const queryKey = sessionKeys.sessionStats();
      expect(queryClient.getQueryState(queryKey)).toBeDefined();
    });
  });

  describe("useAvailableStudents", () => {
    it("calls the correct service method", async () => {
      const mockStudents = { students: [{ id: 1, first_name: "John" }] };
      mockSessionService.getAvailableStudents.mockResolvedValue(
        mockStudents as any
      );

      renderHook(() => useAvailableStudents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSessionService.getAvailableStudents).toHaveBeenCalled();
      });
    });

    it("uses the correct query key", () => {
      mockSessionService.getAvailableStudents.mockResolvedValue({
        students: [],
      });

      const { result } = renderHook(() => useAvailableStudents(), {
        wrapper: createWrapper(),
      });

      const queryKey = sessionKeys.availableStudents();
      expect(queryClient.getQueryState(queryKey)).toBeDefined();
    });
  });
});
