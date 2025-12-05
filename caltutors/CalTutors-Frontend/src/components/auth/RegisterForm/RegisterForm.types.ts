export interface FormData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string;
  user_type: "client" | "tutor";
}

export interface FormErrors {
  [key: string]: string;
}

export interface StepConfig {
  title: string;
  subtitle: string;
  fields: (keyof FormData)[];
}

export interface PasswordStrength {
  score: number;
  label: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export interface BaseStepProps {
  formData: FormData;
  errors: FormErrors;
  touched: { [key: string]: boolean };
  isSubmitting: boolean;
  isLoading: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onPhoneNumberChange?: (value: string) => void;
}

export const STEPS: StepConfig[] = [
  {
    title: "Choose Your Role",
    subtitle: "Are you looking to learn or teach?",
    fields: ["user_type", "first_name", "last_name"],
  },
  {
    title: "Contact Information",
    subtitle: "How can we reach you?",
    fields: ["email", "username", "phone_number"],
  },
  {
    title: "Secure Your Account",
    subtitle: "Create a strong password",
    fields: ["password", "password_confirm"],
  },
];
