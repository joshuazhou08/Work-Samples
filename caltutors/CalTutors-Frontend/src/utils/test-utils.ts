import { User } from "@/types/auth";
import type { Session } from "@/types/session_management";

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  first_name: "Test",
  last_name: "User",
  username: "tester",
  user_type: "client",
  is_staff: false,
  is_superuser: false,
  is_active: true,
  date_joined: "2025-01-01T00:00:00Z",
  phone_number: "+15551234567",
  balance: "30.00",
};

const baseSession: Session = {
  id: 100,
  student: 10,
  tutor: 20,
  student_info: {
    id: 10,
    first_name: "Taylor",
    last_name: "Student",
    email: "student@example.com",
    client_name: "Parent Student",
    client_email: "parent.student@example.com",
  },
  tutor_info: {
    id: 20,
    first_name: "Jordan",
    last_name: "Tutor",
    email: "tutor@example.com",
  },
  student_rate: "60.00",
  tutor_rate: "40.00",
  start_time: "2025-01-01T16:00:00Z",
  end_time: "2025-01-01T17:00:00Z",
  duration_minutes: 60,
  student_charged: false,
  tutor_paid: false,
  created_at: "2024-12-01T10:00:00Z",
  updated_at: "2024-12-01T10:00:00Z",
};

const mergeNested = <T extends object>(
  base: T,
  override: Partial<T> | undefined
): T => {
  return {
    ...base,
    ...(override ? override : {}),
  };
};

export const createSession = (overrides: Partial<Session> = {}): Session => {
  const studentInfo = mergeNested(baseSession.student_info, overrides.student_info);
  const tutorInfo = mergeNested(baseSession.tutor_info, overrides.tutor_info);

  return {
    ...baseSession,
    ...overrides,
    student_info: studentInfo,
    tutor_info: tutorInfo,
  };
};

export { mockUser };
