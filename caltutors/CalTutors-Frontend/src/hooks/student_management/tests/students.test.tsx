import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useStudents,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  usePartialUpdateStudent,
  useDeleteStudent,
} from "../students";
import {
  studentManagementService,
} from "@/services/student_management/students";
import { studentKeys } from "../keys";

jest.mock("@/services/student_management/students");

const mockStudentService =
  studentManagementService as jest.Mocked<typeof studentManagementService>;

describe("student management hooks", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useStudents", () => {
    it("calls list service with params", async () => {
      mockStudentService.list.mockResolvedValue({
        students: [],
        count: 0,
      });

      renderHook(() => useStudents({ search: "john" }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockStudentService.list).toHaveBeenCalledWith({ search: "john" });
      });
    });
  });

  describe("useStudent", () => {
    it("retrieves a student by id", async () => {
      mockStudentService.retrieve.mockResolvedValue(
        { id: 12 } as any
      );

      renderHook(() => useStudent(12), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockStudentService.retrieve).toHaveBeenCalledWith(12);
      });
    });

    it("respects enabled option", () => {
      mockStudentService.retrieve.mockResolvedValue({} as any);

      const { result } = renderHook(() => useStudent(12, { enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockStudentService.retrieve).not.toHaveBeenCalled();
    });
  });

  describe("useCreateStudent", () => {
    it("invalidates list on success", async () => {
      mockStudentService.create.mockResolvedValue({
        message: "created",
        student: { id: 1 } as any,
      });

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateStudent(), { wrapper });

      await result.current.mutateAsync({
        data: { first_name: "Test", last_name: "Student" },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: studentKeys.list(),
        });
      });
    });

    it("passes clientId when provided", async () => {
      mockStudentService.create.mockResolvedValue({
        message: "created",
        student: { id: 1 } as any,
      });

      const { result } = renderHook(() => useCreateStudent(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        data: { first_name: "Test", last_name: "Student" },
        clientId: 42,
      });

      expect(mockStudentService.create).toHaveBeenCalledWith(
        { first_name: "Test", last_name: "Student" },
        { clientId: 42 }
      );
    });
  });

  describe("useUpdateStudent", () => {
    it("invalidates list and detail on success", async () => {
      mockStudentService.update.mockResolvedValue({
        message: "updated",
        student: { id: 7 } as any,
      });

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateStudent(), { wrapper });

      await result.current.mutateAsync({
        studentId: 7,
        data: { first_name: "Updated" },
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: studentKeys.list(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: studentKeys.detail(7),
        });
      });
    });
  });

  describe("usePartialUpdateStudent", () => {
    it("calls partial update and invalidates caches", async () => {
      mockStudentService.partialUpdate.mockResolvedValue({
        message: "updated",
        student: { id: 9 } as any,
      });

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => usePartialUpdateStudent(), {
        wrapper,
      });

      await result.current.mutateAsync({
        studentId: 9,
        data: { grade_level: "10th" },
      });

      await waitFor(() => {
        expect(mockStudentService.partialUpdate).toHaveBeenCalledWith(9, {
          grade_level: "10th",
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: studentKeys.list(),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: studentKeys.detail(9),
        });
      });
    });
  });

  describe("useDeleteStudent", () => {
    it("invalidates list on success", async () => {
      mockStudentService.remove.mockResolvedValue({ message: "deleted" });

      const wrapper = createWrapper();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteStudent(), { wrapper });

      await result.current.mutateAsync({ studentId: 11 });

      await waitFor(() => {
        expect(mockStudentService.remove).toHaveBeenCalledWith(11);
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: studentKeys.list(),
        });
      });
    });
  });
});
