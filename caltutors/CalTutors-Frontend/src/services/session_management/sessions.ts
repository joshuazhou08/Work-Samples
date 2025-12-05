import { transport } from "@/services/transport";
import type {
  Session,
  CreateSessionData,
  UpdateSessionData,
  SessionStats,
  SessionFilters,
  AvailableStudents,
} from "@/types/session_management";

export class SessionService {
  public async getSessions(filters?: SessionFilters): Promise<Session[]> {
    const params = new URLSearchParams();

    if (filters?.tutor_id) {
      params.append("tutor_id", filters.tutor_id.toString());
    }

    if (filters?.student_id) {
      params.append("student_id", filters.student_id.toString());
    }

    if (filters?.client_id) {
      params.append("client_id", filters.client_id.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/sessions/?${queryString}` : "/sessions/";

    return transport.axios.get<Session[]>(url).then((res) => res.data);
  }

  public async getSession(sessionId: number): Promise<Session> {
    return transport.axios
      .get<Session>(`/sessions/${sessionId}/`)
      .then((res) => res.data);
  }

  public async createSession(sessionData: CreateSessionData): Promise<Session> {
    return transport.axios
      .post<Session>("/sessions/", sessionData)
      .then((res) => res.data);
  }

  public async updateSession(
    sessionId: number,
    sessionData: CreateSessionData
  ): Promise<Session> {
    return transport.axios
      .put<Session>(`/sessions/${sessionId}/`, sessionData)
      .then((res) => res.data);
  }

  public async patchSession(
    sessionId: number,
    sessionData: UpdateSessionData
  ): Promise<Session> {
    return transport.axios
      .patch<Session>(`/sessions/${sessionId}/`, sessionData)
      .then((res) => res.data);
  }

  public async deleteSession(sessionId: number): Promise<void> {
    return transport.axios
      .delete<void>(`/sessions/${sessionId}/`)
      .then((res) => res.data);
  }

  public async getUpcomingSessions(): Promise<Session[]> {
    return transport.axios
      .get<Session[]>("/sessions/my-upcoming/")
      .then((res) => res.data);
  }

  public async getSessionStats(): Promise<SessionStats> {
    return transport.axios
      .get<SessionStats>("/sessions/stats/")
      .then((res) => res.data);
  }

  public async getAvailableStudents(): Promise<AvailableStudents> {
    return transport.axios
      .get<AvailableStudents>("/sessions/available-students/")
      .then((res) => res.data);
  }
}

export const sessionService = new SessionService();
