import { transport } from "@/services/transport";
import type {
  Student,
  CreateStudentData,
  UpdateStudentData,
} from "@/types/students";

interface StudentListResponse {
  students: Student[];
  count: number;
}

export interface StudentMutationResponse {
  message: string;
  student: Student;
}

export interface StudentDeleteResponse {
  message: string;
}

export interface StudentDetailResponse {
  student: Student;
}

const BASE_PATH = "/accounts/students/";

class StudentManagementService {
  async list(
    params?: Record<string, string | number | undefined>
  ): Promise<StudentListResponse> {
    return transport.axios
      .get<StudentListResponse>(BASE_PATH, { params })
      .then((res) => res.data);
  }

  async retrieve(studentId: number): Promise<Student> {
    return transport.axios
      .get<StudentDetailResponse>(`${BASE_PATH}${studentId}/`)
      .then((res) => res.data.student);
  }

  async create(
    data: CreateStudentData,
    options?: { clientId?: number }
  ): Promise<StudentMutationResponse> {
    const payload =
      options?.clientId != null
        ? {
            ...data,
            client: options.clientId,
          }
        : data;

    return transport.axios
      .post<StudentMutationResponse>(BASE_PATH, payload)
      .then((res) => res.data);
  }

  async update(
    studentId: number,
    data: UpdateStudentData
  ): Promise<StudentMutationResponse> {
    return transport.axios
      .put<StudentMutationResponse>(`${BASE_PATH}${studentId}/`, data)
      .then((res) => res.data);
  }

  async partialUpdate(
    studentId: number,
    data: Partial<UpdateStudentData>
  ): Promise<StudentMutationResponse> {
    return transport.axios
      .patch<StudentMutationResponse>(`${BASE_PATH}${studentId}/`, data)
      .then((res) => res.data);
  }

  async remove(studentId: number): Promise<StudentDeleteResponse> {
    return transport.axios
      .delete<StudentDeleteResponse>(`${BASE_PATH}${studentId}/`)
      .then((res) => res.data);
  }
}

export const studentManagementService = new StudentManagementService();
