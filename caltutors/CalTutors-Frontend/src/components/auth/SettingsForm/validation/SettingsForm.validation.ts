import { UpdateProfilePayload } from "@/types/auth";
import { TIMEZONE_SET } from "@/utils/timezones";
import { validatePhoneNumber } from "@/utils/phoneUtils";

export type SettingsFormData = Required<
  Pick<
    UpdateProfilePayload,
    "email" | "username" | "first_name" | "last_name" | "timezone"
  >
> &
  Pick<UpdateProfilePayload, "phone_number">;

export type SettingsFormErrors = Partial<
  Record<keyof SettingsFormData, string>
>;

export const validateField = (
  fieldName: keyof SettingsFormData,
  formData: SettingsFormData
): string => {
  const rawValue = formData[fieldName] ?? "";
  const value = typeof rawValue === "string" ? rawValue : "";

  switch (fieldName) {
    case "email":
      if (!value.trim()) return "Email is required";
      if (!/\S+@\S+\.\S+/.test(value.trim()))
        return "Please enter a valid email address";
      break;
    case "username":
      if (!value.trim()) return "Username is required";
      if (value.trim().length < 3)
        return "Username must be at least 3 characters long";
      if (!/^[a-zA-Z0-9_]+$/.test(value.trim()))
        return "Username can only contain letters, numbers, and underscores";
      break;
    case "first_name":
      if (!value.trim()) return "First name is required";
      break;
    case "last_name":
      if (!value.trim()) return "Last name is required";
      break;
    case "phone_number": {
      const trimmed = value.trim();
      if (trimmed && !validatePhoneNumber(trimmed, "US")) {
        return "Please enter a valid phone number";
      }
      break;
    }
    case "timezone": {
      const trimmed = value.trim();
      if (!trimmed) {
        return "Timezone is required";
      }
      if (!TIMEZONE_SET.has(trimmed)) {
        return "Please select a valid timezone";
      }
      break;
    }
  }

  return "";
};

export const validateForm = (
  formData: SettingsFormData
): SettingsFormErrors => {
  const errors: SettingsFormErrors = {};
  (Object.keys(formData) as (keyof SettingsFormData)[]).forEach((field) => {
    const error = validateField(field, formData);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};
