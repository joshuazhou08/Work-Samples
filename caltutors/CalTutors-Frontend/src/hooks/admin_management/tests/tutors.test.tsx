import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useAdminTutors } from "../tutors";
import { tutorService } from "@/services/admin_management";
import { adminKeys } from "../keys";

// Mock the service
jest.mock("@/services/admin_management");

const mockTutorService = tutorService as jest.Mocked<typeof tutorService>;

describe("tutors hooks", () => {
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

  describe("useAdminTutors", () => {
    it("calls the correct service method", async () => {
      const mockTutors = [
        {
          id: 1,
          email: "tutor1@test.com",
          first_name: "John",
          last_name: "Doe",
        },
        {
          id: 2,
          email: "tutor2@test.com",
          first_name: "Jane",
          last_name: "Smith",
        },
      ];
      mockTutorService.getTutors.mockResolvedValue(mockTutors as any);

      const { result } = renderHook(() => useAdminTutors(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockTutorService.getTutors).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockTutors);
      });
    });

    it("returns loading state initially", () => {
      mockTutorService.getTutors.mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useAdminTutors(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("returns error state on failure", async () => {
      const mockError = new Error("Failed to fetch tutors");
      mockTutorService.getTutors.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAdminTutors(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(mockError);
      });
    });
  });
});
