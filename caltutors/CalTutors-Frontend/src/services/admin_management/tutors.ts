import { transport } from "@/services/transport";
import { AdminUser, TutorsResponse } from "@/types/admin_management";

export class TutorService {
  public async getTutors(): Promise<AdminUser[]> {
    return transport.axios
      .get<TutorsResponse>("/admin/tutors/")
      .then((res) => res.data.tutors);
  }
}

export const tutorService = new TutorService();
