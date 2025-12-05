import { transport } from "@/services/transport";
import {
  Charge,
  CreateChargeData,
  UpdateChargeData,
  ChargeFilters,
  ChargesResponse,
  ChargeResponse,
  TutorPayment,
  TutorPaymentsResponse,
  UnchargedSessionGroup,
  UnchargedSessionsResponse,
  FinanceStats,
} from "@/types/admin_management";

export class ChargeService {
  public async getCharges(filters?: ChargeFilters): Promise<Charge[]> {
    const params = new URLSearchParams();

    if (filters?.user_id) {
      params.append("user_id", filters.user_id.toString());
    }

    if (filters?.status) {
      params.append("status", filters.status);
    }

    if (filters?.start_date) {
      params.append("start_date", filters.start_date);
    }

    if (filters?.end_date) {
      params.append("end_date", filters.end_date);
    }

    const queryString = params.toString();
    const url = queryString
      ? `/payments/charges/?${queryString}`
      : "/payments/charges/";

    return transport.axios
      .get<ChargesResponse>(url)
      .then((res) => res.data.charges);
  }

  public async getCharge(chargeId: number): Promise<Charge> {
    return transport.axios
      .get<ChargeResponse>(`/payments/charges/${chargeId}/`)
      .then((res) => res.data.charge);
  }

  public async createCharge(chargeData: CreateChargeData): Promise<Charge> {
    return transport.axios
      .post<ChargeResponse>("/payments/charges/", chargeData)
      .then((res) => res.data.charge);
  }

  public async updateCharge(
    chargeId: number,
    chargeData: UpdateChargeData
  ): Promise<Charge> {
    return transport.axios
      .patch<ChargeResponse>(`/payments/charges/${chargeId}/`, chargeData)
      .then((res) => res.data.charge);
  }

  public async patchCharge(
    chargeId: number,
    chargeData: Partial<UpdateChargeData>
  ): Promise<Charge> {
    return transport.axios
      .patch<ChargeResponse>(`/payments/charges/${chargeId}/`, chargeData)
      .then((res) => res.data.charge);
  }

  public async deleteCharge(chargeId: number): Promise<void> {
    return transport.axios
      .delete(`/payments/charges/${chargeId}/`)
      .then((res) => res.data);
  }

  public async getClientCharges(): Promise<Charge[]> {
    return transport.axios
      .get<ChargesResponse>("/payments/charges/client-charges/")
      .then((res) => res.data.charges);
  }

  public async getTutorPayments(
    startDate?: string,
    endDate?: string
  ): Promise<TutorPayment[]> {
    const params = new URLSearchParams();

    if (startDate) {
      params.append("start_date", startDate);
    }

    if (endDate) {
      params.append("end_date", endDate);
    }

    const queryString = params.toString();
    const url = queryString
      ? `/admin/tutor-payments/?${queryString}`
      : "/admin/tutor-payments/";

    return transport.axios
      .get<TutorPaymentsResponse>(url)
      .then((res) => res.data.tutor_payments);
  }

  public async getUnchargedSessions(): Promise<UnchargedSessionGroup[]> {
    return transport.axios
      .get<UnchargedSessionsResponse>("/admin/uncharged-sessions/")
      .then((res) => res.data.uncharged_sessions);
  }

  public async getFinanceStats(
    startDate: string,
    endDate: string
  ): Promise<FinanceStats> {
    const params = new URLSearchParams();

    if (startDate) {
      params.append("start_date", startDate);
    }

    if (endDate) {
      params.append("end_date", endDate);
    }

    const queryString = params.toString();
    const url = queryString
      ? `/admin/finance-stats/?${queryString}`
      : "/admin/finance-stats/";

    return transport.axios.get<FinanceStats>(url).then((res) => res.data);
  }
}

export const chargeService = new ChargeService();
