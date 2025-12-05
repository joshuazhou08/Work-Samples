export type AdminUser = import("@/types/auth").User & {
  is_recently_active: boolean;
  notices: string[];
};

export interface TutorsResponse {
  tutors: AdminUser[];
  count: number;
}

export interface ClientsResponse {
  clients: AdminUser[];
  count: number;
}

export interface StudentsResponse {
  students: import("@/types/students").Student[];
  count: number;
}

export interface Charge {
  id: number;
  user: number;
  stripe_checkout_id?: string;
  amount: string;
  credits_applied: string;
  final_amount: string;
  currency: string;
  status: "pending" | "paid";
  created_at: string;
  sessions: number[];
  user_info: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  session_count: number;
  session_details: Array<{
    id: number;
    start_time: string;
    duration_minutes: number;
    tutor_name: string;
    student_name: string;
    student_rate?: string | null;
    tutor_rate?: string | null;
    student_charge?: string | null;
    tutor_payment?: string | null;
    session_amount?: string | null;
  }>;
}

export interface CreateChargeData {
  user: number;
  session_ids: number[];
  amount: string;
  credits_applied?: string;
  currency?: string;
  status?: "pending" | "paid";
  stripe_checkout_id?: string;
}

export interface UpdateChargeData {
  status?: "pending" | "paid";
  stripe_checkout_id?: string;
  credits_applied?: string;
}

export interface ChargeFilters {
  user_id?: number;
  status?: "pending" | "paid";
  start_date?: string;
  end_date?: string;
}

export interface ChargesResponse {
  charges: Charge[];
}

export interface ChargeResponse {
  charge: Charge;
  message?: string;
}

export interface TutorPaymentSession {
  id: number;
  student_name: string;
  start_time: string;
  duration_minutes: number;
  tutor_pay_rate?: string;
  session_amount?: string;
  student_rate?: string | null;
  student_charge?: string | null;
  tutor_rate?: string | null;
  tutor_payment?: string | null;
}

export interface TutorPayment {
  tutor: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  total_amount: string;
  session_count: number;
  sessions: TutorPaymentSession[];
}

export interface TutorPaymentsResponse {
  tutor_payments: TutorPayment[];
  count: number;
}

export interface UnchargedSessionItem {
  id: number;
  tutor_name: string;
  start_time: string;
  duration_minutes: number;
}

export interface UnchargedSessionGroup {
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    grade_level: string;
  };
  client: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  sessions: UnchargedSessionItem[];
}

export interface UnchargedSessionsResponse {
  uncharged_sessions: UnchargedSessionGroup[];
  count: number;
}

export interface FinanceStats {
  total_revenue: string;
  total_tutor_payments: string;
  platform_revenue: string;
  uncharged_sessions_count: number;
  start_date: string;
  end_date: string;
}

// ===== SESSION STATS =====

export interface TutorSessionStat {
  tutor: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  session_count: number;
}

export interface SessionStats {
  total_sessions: number;
  completed_sessions: number;
  upcoming_sessions: number;
  in_progress_sessions: number;
  total_hours: string;
  top_tutors: TutorSessionStat[];
  bottom_tutors: TutorSessionStat[];
  start_date: string | null;
  end_date: string | null;
}

export type { CreateRateData } from "@/types/session_management";
