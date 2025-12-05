import { useQuery } from "@tanstack/react-query";
import { tutorService } from "@/services/admin_management";
import { AdminUser } from "@/types/admin_management";
import { adminKeys } from "./keys";

export function useAdminTutors() {
  return useQuery({
    queryKey: adminKeys.tutors(),
    queryFn: (): Promise<AdminUser[]> => tutorService.getTutors(),
  });
}
