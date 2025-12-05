import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useSessionStats } from "../sessions";
import { sessionService } from "@/services/admin_management/sessions";
import { adminKeys } from "../keys";

// Mock the services
jest.mock("@/services/admin_management/sessions");

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

  describe("useSessionStats", () => {
    const startDate = "2025-01-01";
    const endDate = "2025-01-31";

    it("calls the correct service method", async () => {
      const mockStats = {
        total_sessions: 10,
        completed_sessions: 6,
        upcoming_sessions: 3,
        in_progress_sessions: 1,
        total_hours: "15.5",
        top_tutors: [],
        bottom_tutors: [],
        start_date: startDate,
        end_date: endDate,
      };
      mockSessionService.getSessionStats.mockResolvedValue(mockStats);

      renderHook(() => useSessionStats(startDate, endDate), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSessionService.getSessionStats).toHaveBeenCalledWith(
          startDate,
          endDate
        );
      });
    });

    it("uses the correct query key", () => {
      mockSessionService.getSessionStats.mockResolvedValue({} as any);

      const { result } = renderHook(() => useSessionStats(startDate, endDate), {
        wrapper: createWrapper(),
      });

      const queryKey = adminKeys.sessionStats(startDate, endDate);
      expect(queryClient.getQueryState(queryKey)).toBeDefined();
    });

    it("respects enabled option when false", () => {
      mockSessionService.getSessionStats.mockResolvedValue({} as any);

      const { result } = renderHook(
        () => useSessionStats(startDate, endDate, { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(mockSessionService.getSessionStats).not.toHaveBeenCalled();
    });

    it("is enabled by default", async () => {
      mockSessionService.getSessionStats.mockResolvedValue({} as any);

      renderHook(() => useSessionStats(startDate, endDate), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockSessionService.getSessionStats).toHaveBeenCalled();
      });
    });

    it("returns session stats data", async () => {
      const mockStats = {
        total_sessions: 25,
        completed_sessions: 18,
        upcoming_sessions: 5,
        in_progress_sessions: 2,
        total_hours: "42.5",
        top_tutors: [
          {
            tutor: {
              id: 1,
              first_name: "John",
              last_name: "Smith",
              email: "john@example.com",
            },
            session_count: 10,
          },
          {
            tutor: {
              id: 2,
              first_name: "Sarah",
              last_name: "Johnson",
              email: "sarah@example.com",
            },
            session_count: 8,
          },
        ],
        bottom_tutors: [
          {
            tutor: {
              id: 3,
              first_name: "Mike",
              last_name: "Wilson",
              email: "mike@example.com",
            },
            session_count: 2,
          },
        ],
        start_date: startDate,
        end_date: endDate,
      };
      mockSessionService.getSessionStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useSessionStats(startDate, endDate), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
    });

    it("uses correct query key for caching", async () => {
      const mockStats = {
        total_sessions: 10,
        completed_sessions: 5,
        upcoming_sessions: 3,
        in_progress_sessions: 2,
        total_hours: "15.0",
        top_tutors: [],
        bottom_tutors: [],
        start_date: startDate,
        end_date: endDate,
      };
      mockSessionService.getSessionStats.mockResolvedValue(mockStats);

      const wrapper = createWrapper();

      renderHook(() => useSessionStats(startDate, endDate), {
        wrapper,
      });

      await waitFor(() => {
        expect(mockSessionService.getSessionStats).toHaveBeenCalledTimes(1);
      });

      // Verify data is in cache with correct key
      const queryKey = adminKeys.sessionStats(startDate, endDate);
      const cachedData = queryClient.getQueryData(queryKey);
      expect(cachedData).toEqual(mockStats);
    });

    it("creates different cache keys for different date ranges", async () => {
      mockSessionService.getSessionStats.mockResolvedValue({} as any);

      const wrapper = createWrapper();

      // First date range
      const { rerender } = renderHook(
        ({ start, end }: { start: string; end: string }) =>
          useSessionStats(start, end),
        {
          wrapper,
          initialProps: { start: "2025-01-01", end: "2025-01-31" },
        }
      );

      await waitFor(() => {
        expect(mockSessionService.getSessionStats).toHaveBeenCalledTimes(1);
      });

      // Second date range - should trigger new fetch
      rerender({ start: "2025-02-01", end: "2025-02-28" });

      await waitFor(() => {
        expect(mockSessionService.getSessionStats).toHaveBeenCalledTimes(2);
      });

      // Verify different keys exist in cache
      const key1 = adminKeys.sessionStats("2025-01-01", "2025-01-31");
      const key2 = adminKeys.sessionStats("2025-02-01", "2025-02-28");

      expect(queryClient.getQueryState(key1)).toBeDefined();
      expect(queryClient.getQueryState(key2)).toBeDefined();
      expect(key1).not.toEqual(key2);
    });

    it("handles empty top tutors array", async () => {
      const mockStats = {
        total_sessions: 0,
        completed_sessions: 0,
        upcoming_sessions: 0,
        in_progress_sessions: 0,
        total_hours: "0.0",
        top_tutors: [],
        bottom_tutors: [],
        start_date: startDate,
        end_date: endDate,
      };
      mockSessionService.getSessionStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useSessionStats(startDate, endDate), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.top_tutors).toEqual([]);
      expect(result.current.data?.bottom_tutors).toEqual([]);
    });
  });

  describe("adminKeys.sessionStats", () => {
    it("generates correct query key", () => {
      const key = adminKeys.sessionStats("2025-01-01", "2025-01-31");
      expect(key).toEqual([
        "admin",
        "session-stats",
        "2025-01-01",
        "2025-01-31",
      ]);
    });

    it("creates same key on multiple calls with same params", () => {
      const key1 = adminKeys.sessionStats("2025-01-01", "2025-01-31");
      const key2 = adminKeys.sessionStats("2025-01-01", "2025-01-31");

      expect(key1).toEqual(key2);
    });

    it("creates different keys for different date ranges", () => {
      const key1 = adminKeys.sessionStats("2025-01-01", "2025-01-31");
      const key2 = adminKeys.sessionStats("2025-02-01", "2025-02-28");

      expect(key1).not.toEqual(key2);
    });

    it("includes dates in query key for proper cache separation", () => {
      const startDate = "2025-01-01";
      const endDate = "2025-01-31";
      const key = adminKeys.sessionStats(startDate, endDate);

      expect(key).toContain(startDate);
      expect(key).toContain(endDate);
    });
  });
});
