export interface Student {
  id: number;
  client: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  grade_level?: string;
  subjects_studying?: string;
  subjects_list?: string[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client_name?: string;
  hasTutors?: boolean;
}

export interface CreateStudentData {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  grade_level?: string;
  subjects_studying?: string;
  notes?: string;
}

export interface UpdateStudentData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  grade_level?: string;
  subjects_studying?: string;
  notes?: string;
  is_active?: boolean;
}
