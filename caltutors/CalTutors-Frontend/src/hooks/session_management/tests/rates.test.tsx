import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useAllRates,
  useStudentRates,
  useTutorRates,
  useCreateRate,
  useUpdateRate,
  useDeleteRate,
} from "../rates";
import { rateService } from "@/services/session_management";
import { sessionKeys } from "../keys";

jest.mock("@/services/session_management");

const mockRateService = rateService as jest.Mocked<typeof rateService>;

describe("rates hooks", () => {
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

  describe("useAllRates", () => {
    it("calls the correct service method", async () => {
      const mockRates = [{ id: 1, student_rate: "50.00" }];
      mockRateService.getAllRates.mockResolvedValue(mockRates as any);

      renderHook(() => useAllRates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockRateService.getAllRates).toHaveBeenCalled();
      });
    });

    it("respects enabled option", () => {
      mockRateService.getAllRates.mockResolvedValue([]);

      const { result } = renderHook(() => useAllRates({ enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockRateService.getAllRates).not.toHaveBeenCalled();
    });
  });

  describe("useStudentRates", () => {
    it("calls the correct service method", async () => {
      const mockRates = [{ id: 1, student_rate: "50.00" }];
      mockRateService.getStudentRates.mockResolvedValue(mockRates as any);

      renderHook(() => useStudentRates(5), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockRateService.getStudentRates).toHaveBeenCalledWith(5);
      });
    });

    it("uses the correct query key", () => {
      mockRateService.getStudentRates.mockResolvedValue([]);

      const { result } = renderHook(() => useStudentRates(5), {
        wrapper: createWrapper(),
      });

      const queryKey = sessionKeys.studentRates(5);
      expect(queryClient.getQueryState(queryKey)).toBeDefined();
    });

    it("is disabled when studentId is 0", () => {
      mockRateService.getStudentRates.mockResolvedValue([]);

      const { result } = renderHook(() => useStudentRates(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockRateService.getStudentRates).not.toHaveBeenCalled();
    });

    it("is enabled when studentId is valid", async () => {
      mockRateService.getStudentRates.mockResolvedValue([]);

      renderHook(() => useStudentRates(5), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockRateService.getStudentRates).toHaveBeenCalled();
      });
    });
  });

  describe("useTutorRates", () => {
    it("calls the correct service method", async () => {
      const mockRates = [{ id: 1, tutor_pay_rate: "40.00" }];
      mockRateService.getTutorRates.mockResolvedValue(mockRates as any);

      renderHook(() => useTutorRates(3), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockRateService.getTutorRates).toHaveBeenCalledWith(3);
      });
    });

    it("uses the correct query key", () => {
      mockRateService.getTutorRates.mockResolvedValue([]);

      const { result } = renderHook(() => useTutorRates(3), {
        wrapper: createWrapper(),
      });

      const queryKey = sessionKeys.tutorRates(3);
      expect(queryClient.getQueryState(queryKey)).toBeDefined();
    });

    it("is disabled when tutorId is 0", () => {
      mockRateService.getTutorRates.mockResolvedValue([]);

      const { result } = renderHook(() => useTutorRates(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockRateService.getTutorRates).not.toHaveBeenCalled();
    });

    it("is enabled when tutorId is valid", async () => {
      mockRateService.getTutorRates.mockResolvedValue([]);

      renderHook(() => useTutorRates(3), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockRateService.getTutorRates).toHaveBeenCalled();
      });
    });
  });

  describe("useCreateRate", () => {
    it("invalidates the correct query keys on success", async () => {
      const mockNewRate = {
        id: 1,
        student: 5,
        tutor: 3,
        student_rate: "50.00",
        tutor_pay_rate: "40.00",
      };

      mockRateService.createRate.mockResolvedValue(mockNewRate as any);

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateRate(), { wrapper });

      await result.current.mutateAsync({
        student: 5,
        tutor: 3,
        student_rate: "50.00",
        tutor_pay_rate: "40.00",
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.rates(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.studentRates(5),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.tutorRates(3),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);
    });

    it("calls the correct service method", async () => {
      const mockNewRate = { id: 1, student: 5, tutor: 3 };
      mockRateService.createRate.mockResolvedValue(mockNewRate as any);

      const { result } = renderHook(() => useCreateRate(), {
        wrapper: createWrapper(),
      });

      const rateData = {
        student: 5,
        tutor: 3,
        student_rate: "50.00",
        tutor_pay_rate: "40.00",
      };

      await result.current.mutateAsync(rateData);

      expect(mockRateService.createRate).toHaveBeenCalledWith(rateData);
    });
  });

  describe("useUpdateRate", () => {
    it("invalidates the correct query keys on success", async () => {
      const mockUpdatedRate = {
        id: 1,
        student: 10,
        tutor: 7,
        student_rate: "75.00",
        tutor_pay_rate: "55.00",
      };

      mockRateService.updateRate.mockResolvedValue(mockUpdatedRate as any);

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateRate(), { wrapper });

      await result.current.mutateAsync({
        rateId: 1,
        rateData: { student_rate: "75.00" },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.rates(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.studentRates(10),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.tutorRates(7),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);
    });

    it("calls the correct service method", async () => {
      const mockUpdatedRate = { id: 1, student: 10, tutor: 7 };
      mockRateService.updateRate.mockResolvedValue(mockUpdatedRate as any);

      const { result } = renderHook(() => useUpdateRate(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        rateId: 1,
        rateData: { student_rate: "75.00" },
      });

      expect(mockRateService.updateRate).toHaveBeenCalledWith(1, {
        student_rate: "75.00",
      });
    });
  });

  describe("useDeleteRate", () => {
    it("invalidates only the rates query key on success", async () => {
      mockRateService.deleteRate.mockResolvedValue(undefined as any);

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteRate(), { wrapper });

      await result.current.mutateAsync(1);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: sessionKeys.rates(),
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1);
    });

    it("calls the correct service method", async () => {
      mockRateService.deleteRate.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useDeleteRate(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(1);

      expect(mockRateService.deleteRate).toHaveBeenCalledWith(1);
    });
  });
});
