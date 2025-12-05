export interface UserBasicInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface StudentBasicInfo {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  client_name?: string;
  client_email?: string;
}

export interface Session {
  id: number;
  student: number;
  tutor: number;
  student_info: StudentBasicInfo;
  tutor_info: UserBasicInfo;
  student_rate?: string | null;
  tutor_rate?: string | null;
  start_time: string;
  duration_minutes: number;
  end_time: string;
  student_charged: boolean;
  tutor_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionData {
  student: number;
  tutor: number;
  start_time: string;
  duration_minutes: number;
}

export interface UpdateSessionData {
  student?: number;
  tutor?: number;
  start_time?: string;
  duration_minutes?: number;
}

export interface SessionStats {
  total_sessions: number;
  upcoming_sessions: number;
  past_sessions: number;
  total_hours: number;
  sessions_as_student: number;
  sessions_as_tutor: number;
}

export interface SessionFilters {
  tutor_id?: number;
  client_id?: number;
  student_id?: number;
}

export interface AvailableStudents {
  students: StudentBasicInfo[];
}

export interface Rate {
  id: number;
  tutor: number;
  student: number;
  student_info?: StudentBasicInfo;
  tutor_info?: UserBasicInfo;
  student_rate: string;
  tutor_pay_rate: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRateData {
  tutor: number;
  student: number;
  student_rate: string;
  tutor_pay_rate: string;
}
