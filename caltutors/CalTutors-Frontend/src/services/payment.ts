import { transport } from "@/services/transport";

export interface BillingPortalRequest {
  returnUrl?: string;
}

export interface BillingPortalResponse {
  url: string;
}

class PaymentService {
  public async createBillingPortalSession(
    payload?: BillingPortalRequest
  ): Promise<BillingPortalResponse> {
    const body = payload?.returnUrl
      ? { return_url: payload.returnUrl }
      : undefined;

    return transport.axios
      .post<BillingPortalResponse>(
        "/payments/billing-portal-session/",
        body ?? {}
      )
      .then((res) => res.data);
  }
}

export const paymentService = new PaymentService();
