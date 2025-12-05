import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  studentManagementService,
  StudentMutationResponse,
  StudentDeleteResponse,
} from "@/services/student_management/students";
import type { CreateStudentData, UpdateStudentData } from "@/types/students";
import { studentKeys } from "./keys";

export function useStudents(params?: Record<string, any>) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => studentManagementService.list(params),
  });
}

export function useStudent(
  studentId: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: studentKeys.detail(studentId),
    queryFn: () => studentManagementService.retrieve(studentId),
    enabled: options?.enabled ?? true,
  });
}

type CreateStudentVariables = {
  data: CreateStudentData;
  clientId?: number;
};

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation<StudentMutationResponse, unknown, CreateStudentVariables>({
    mutationFn: ({ data, clientId }) =>
      studentManagementService.create(data, { clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.list() });
    },
  });
}

type UpdateStudentVariables = {
  studentId: number;
  data: UpdateStudentData;
};

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation<StudentMutationResponse, unknown, UpdateStudentVariables>({
    mutationFn: ({ studentId, data }) =>
      studentManagementService.update(studentId, data),
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.list() });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(studentId) });
    },
  });
}

type PartialUpdateStudentVariables = {
  studentId: number;
  data: Partial<UpdateStudentData>;
};

export function usePartialUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation<StudentMutationResponse, unknown, PartialUpdateStudentVariables>({
    mutationFn: ({ studentId, data }) =>
      studentManagementService.partialUpdate(studentId, data),
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.list() });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(studentId) });
    },
  });
}

type DeleteStudentVariables = {
  studentId: number;
};

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation<StudentDeleteResponse, unknown, DeleteStudentVariables>({
    mutationFn: ({ studentId }) => studentManagementService.remove(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.list() });
    },
  });
}
