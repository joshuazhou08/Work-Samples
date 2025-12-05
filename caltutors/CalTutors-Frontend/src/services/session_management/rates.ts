import { transport } from "@/services/transport";
import type { Rate, CreateRateData } from "@/types/session_management";

export class RateService {
  public async getAllRates(filters?: {
    tutor_id?: number;
    student_id?: number;
  }): Promise<Rate[]> {
    const params = new URLSearchParams();
    if (filters?.tutor_id)
      params.append("tutor_id", filters.tutor_id.toString());
    if (filters?.student_id)
      params.append("student_id", filters.student_id.toString());

    const queryString = params.toString();
    const url = queryString ? `/admin/rates/?${queryString}` : "/admin/rates/";

    return transport.axios.get<Rate[]>(url).then((res) => res.data);
  }

  public async getRate(rateId: number): Promise<Rate> {
    return transport.axios
      .get<Rate>(`/admin/rates/${rateId}/`)
      .then((res) => res.data);
  }

  public async createRate(rateData: CreateRateData): Promise<Rate> {
    return transport.axios
      .post<Rate>("/admin/rates/", rateData)
      .then((res) => res.data);
  }

  public async updateRate(
    rateId: number,
    rateData: Partial<CreateRateData>
  ): Promise<Rate> {
    return transport.axios
      .patch<Rate>(`/admin/rates/${rateId}/`, rateData)
      .then((res) => res.data);
  }

  public async deleteRate(rateId: number): Promise<void> {
    return transport.axios
      .delete(`/admin/rates/${rateId}/`)
      .then((res) => res.data);
  }

  public async getStudentRates(studentId: number): Promise<Rate[]> {
    return transport.axios
      .get<Rate[]>(`/sessions/rates/student/${studentId}/`)
      .then((res) => res.data);
  }

  public async getTutorRates(tutorId: number): Promise<Rate[]> {
    return transport.axios
      .get<Rate[]>(`/sessions/rates/tutor/${tutorId}/`)
      .then((res) => res.data);
  }
}

export const rateService = new RateService();
