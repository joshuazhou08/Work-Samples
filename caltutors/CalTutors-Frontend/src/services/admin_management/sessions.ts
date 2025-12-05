import { transport } from "@/services/transport";
import type { SessionStats } from "@/types/admin_management";

export class SessionService {
  public async getSessionStats(
    startDate: string,
    endDate: string
  ): Promise<SessionStats> {
    const params = new URLSearchParams();

    if (startDate) {
      params.append("start_date", startDate);
    }

    if (endDate) {
      params.append("end_date", endDate);
    }

    const queryString = params.toString();
    const url = queryString
      ? `/admin/session-stats/?${queryString}`
      : "/admin/session-stats/";

    return transport.axios.get<SessionStats>(url).then((res) => res.data);
  }
}

export const sessionService = new SessionService();
