import { FormData, FormErrors, PasswordStrength } from "../RegisterForm.types";
import { validatePhoneNumber } from "@/utils/phoneUtils";

export const validateField = (
  fieldName: keyof FormData,
  formData: FormData
): string => {
  const value = formData[fieldName];

  switch (fieldName) {
    case "email":
      if (!value) return "Email is required";
      if (!/\S+@\S+\.\S+/.test(value))
        return "Please enter a valid email address";
      break;
    case "password":
      if (!value) return "Password is required";
      if (value.length < 8)
        return "Password must be at least 8 characters long";
      break;
    case "password_confirm":
      if (!value) return "Please confirm your password";
      if (value !== formData.password) return "Passwords do not match";
      break;
    case "first_name":
      if (!value.trim()) return "First name is required";
      break;
    case "last_name":
      if (!value.trim()) return "Last name is required";
      break;
    case "username":
      if (!value.trim()) return "Username is required";
      if (value.length < 3)
        return "Username must be at least 3 characters long";
      if (!/^[a-zA-Z0-9_]+$/.test(value))
        return "Username can only contain letters, numbers, and underscores";
      break;
    case "phone_number": {
      const trimmed = value.trim();
      if (!trimmed) return "Phone number is required";

      // Use libphonenumber-js for validation
      if (!validatePhoneNumber(trimmed, "US")) {
        return "Please enter a valid phone number";
      }
      break;
    }
  }
  return "";
};

export const validateStep = (
  stepFields: (keyof FormData)[],
  formData: FormData
): FormErrors => {
  const newErrors: FormErrors = {};

  stepFields.forEach((field) => {
    const error = validateField(field, formData);
    if (error) {
      newErrors[field] = error;
    }
  });

  return newErrors;
};

export const validateForm = (formData: FormData): FormErrors => {
  const newErrors: FormErrors = {};
  const allFields: (keyof FormData)[] = [
    "email",
    "password",
    "password_confirm",
    "first_name",
    "last_name",
    "username",
    "phone_number",
  ];

  allFields.forEach((field) => {
    const error = validateField(field, formData);
    if (error) {
      newErrors[field] = error;
    }
  });

  return newErrors;
};

export const calculatePasswordStrength = (
  password: string
): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  let label = "";

  if (password.length === 0) {
    label = "";
  } else if (score <= 2) {
    label = "weak";
  } else if (score === 3) {
    label = "fair";
  } else if (score === 4) {
    label = "good";
  } else {
    label = "strong";
  }

  return { score, label, requirements };
};
