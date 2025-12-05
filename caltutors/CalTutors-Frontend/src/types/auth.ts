export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  user_type: "client" | "tutor" | "admin";
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  date_joined?: string;
  phone_number?: string;
  subjects_taught?: string;
  balance?: string;
  hasStudents?: boolean; // For clients
  hasActiveStudents?: boolean; // For tutors
  timezone?: string;
  billing_status?: "missing" | "invalid" | "valid";
}
export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string;
  user_type: "client" | "tutor";
}

// Example Login response type
export interface LoginResponse {
  token: string;
  user: User;
}

export interface UpdateProfilePayload {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  timezone?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}
