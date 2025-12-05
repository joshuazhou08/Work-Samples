import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useTutorPayments, useUnchargedSessions } from "../finances";
import { chargeService } from "@/services/admin_management";
import { adminKeys } from "../keys";

// Mock the services
jest.mock("@/services/admin_management");

const mockChargeService = chargeService as jest.Mocked<typeof chargeService>;

describe("finances hooks", () => {
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

  describe("useTutorPayments", () => {
    it("calls the correct service method without dates", async () => {
      const mockPayments = [
        {
          tutor: {
            id: 1,
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
          },
          total_amount: "100.00",
          session_count: 2,
          sessions: [],
        },
      ];
      mockChargeService.getTutorPayments.mockResolvedValue(mockPayments as any);

      renderHook(() => useTutorPayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockChargeService.getTutorPayments).toHaveBeenCalled();
      });
    });

    it("uses the correct query key", () => {
      mockChargeService.getTutorPayments.mockResolvedValue([]);

      const { result } = renderHook(() => useTutorPayments(), {
        wrapper: createWrapper(),
      });

      const queryKey = adminKeys.tutorPayments();
      expect(queryClient.getQueryState(queryKey)).toBeDefined();
    });

    it("respects enabled option when false", () => {
      mockChargeService.getTutorPayments.mockResolvedValue([]);

      const { result } = renderHook(
        () => useTutorPayments(undefined, undefined, { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(mockChargeService.getTutorPayments).not.toHaveBeenCalled();
    });

    it("is enabled by default", async () => {
      mockChargeService.getTutorPayments.mockResolvedValue([]);

      renderHook(() => useTutorPayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockChargeService.getTutorPayments).toHaveBeenCalled();
      });
    });

    it("returns tutor payments data", async () => {
      const mockPayments = [
        {
          tutor: {
            id: 1,
            first_name: "Alice",
            last_name: "Smith",
            email: "alice@example.com",
          },
          total_amount: "250.50",
          session_count: 5,
          sessions: [
            {
              id: 1,
              student_name: "Bob Student",
              start_time: "2024-01-15T10:00:00Z",
              duration_minutes: 60,
              tutor_pay_rate: "50.00",
              session_amount: "50.00",
            },
          ],
        },
      ];
      mockChargeService.getTutorPayments.mockResolvedValue(mockPayments as any);

      const { result } = renderHook(() => useTutorPayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPayments);
    });

    it("uses correct query key for caching", async () => {
      const mockPayments = [{ tutor: { id: 1 } }];
      mockChargeService.getTutorPayments.mockResolvedValue(mockPayments as any);

      const wrapper = createWrapper();

      renderHook(() => useTutorPayments(), {
        wrapper,
      });

      await waitFor(() => {
        expect(mockChargeService.getTutorPayments).toHaveBeenCalledTimes(1);
      });

      // Verify data is in cache with correct key
      const queryKey = adminKeys.tutorPayments();
      const cachedData = queryClient.getQueryData(queryKey);
      expect(cachedData).toEqual(mockPayments);
    });
  });

  describe("adminKeys.tutorPayments", () => {
    it("generates correct query key", () => {
      const key = adminKeys.tutorPayments();
      expect(key).toEqual(["admin", "tutor-payments"]);
    });

    it("creates same key on multiple calls", () => {
      const key1 = adminKeys.tutorPayments();
      const key2 = adminKeys.tutorPayments();

      expect(key1).toEqual(key2);
    });
  });

  describe("useUnchargedSessions", () => {
    it("calls the correct service method", async () => {
      const mockSessions = [
        {
          student: { id: 1, first_name: "John", last_name: "Doe" },
          client: {
            id: 2,
            first_name: "Jane",
            last_name: "Parent",
            email: "jane@test.com",
            phone_number: "+15550000000",
          },
          sessions: [],
        },
      ];
      mockChargeService.getUnchargedSessions.mockResolvedValue(
        mockSessions as any
      );

      renderHook(() => useUnchargedSessions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockChargeService.getUnchargedSessions).toHaveBeenCalled();
      });
    });

    it("respects enabled option", () => {
      mockChargeService.getUnchargedSessions.mockResolvedValue([]);

      const { result } = renderHook(
        () => useUnchargedSessions({ enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(mockChargeService.getUnchargedSessions).not.toHaveBeenCalled();
    });

    it("returns uncharged sessions data", async () => {
      const mockSessions = [
        {
          student: {
            id: 1,
            first_name: "Emma",
            last_name: "Williams",
            email: "emma@test.com",
            phone_number: "",
            grade_level: "10th Grade",
          },
          client: {
            id: 2,
            first_name: "Mary",
            last_name: "Williams",
            email: "mary@test.com",
            phone_number: "+15551112222",
          },
          sessions: [
            {
              id: 1,
              tutor_name: "Alice Tutor",
              start_time: "2024-01-15T10:00:00Z",
              duration_minutes: 60,
            },
          ],
        },
      ];
      mockChargeService.getUnchargedSessions.mockResolvedValue(
        mockSessions as any
      );

      const { result } = renderHook(() => useUnchargedSessions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSessions);
    });

    it("uses correct query key for caching", async () => {
      const mockSessions = [{ student: { id: 1 } }];
      mockChargeService.getUnchargedSessions.mockResolvedValue(
        mockSessions as any
      );

      const wrapper = createWrapper();

      renderHook(() => useUnchargedSessions(), {
        wrapper,
      });

      await waitFor(() => {
        expect(mockChargeService.getUnchargedSessions).toHaveBeenCalledTimes(1);
      });

      const queryKey = adminKeys.unchargedSessions();
      const cachedData = queryClient.getQueryData(queryKey);
      expect(cachedData).toEqual(mockSessions);
    });
  });

  describe("adminKeys.unchargedSessions", () => {
    it("generates correct query key", () => {
      const key = adminKeys.unchargedSessions();
      expect(key).toEqual(["admin", "uncharged-sessions"]);
    });

    it("creates same key on multiple calls", () => {
      const key1 = adminKeys.unchargedSessions();
      const key2 = adminKeys.unchargedSessions();

      expect(key1).toEqual(key2);
    });
  });
});
