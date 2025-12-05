import {
  AsYouType,
  parsePhoneNumber,
  isValidPhoneNumber,
} from "libphonenumber-js";

/**
 * Format phone number as user types
 * Uses libphonenumber-js for proper international formatting
 */
export const formatPhoneNumber = (
  value: string,
  defaultCountry: "US" | string = "US"
): string => {
  if (!value) return "";

  try {
    // Use AsYouType for real-time formatting
    const formatter = new AsYouType(defaultCountry as any);
    return formatter.input(value);
  } catch (error) {
    // If parsing fails, return the value as-is
    return value;
  }
};

/**
 * Convert phone number to E.164 format (+1234567890)
 * Uses libphonenumber-js for proper parsing and validation
 */
export const convertToE164 = (
  phoneNumber: string,
  defaultCountry: "US" | string = "US"
): string => {
  if (!phoneNumber) return "";

  try {
    // Try to parse the phone number
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry as any);

    // If valid, return E.164 format
    if (parsed && parsed.isValid()) {
      return parsed.format("E.164");
    }

    // If parsing failed but it looks like an E.164 number already, clean it
    if (phoneNumber.startsWith("+")) {
      const cleaned = phoneNumber.replace(/[^\d+]/g, "");
      return cleaned;
    }

    // Last resort: try to parse as US number
    const parsedUS = parsePhoneNumber(phoneNumber, "US");
    if (parsedUS) {
      return parsedUS.format("E.164");
    }

    return phoneNumber;
  } catch (error) {
    // If all parsing fails, return the original value
    return phoneNumber;
  }
};

/**
 * Validate if a phone number is valid
 */
export const validatePhoneNumber = (
  phoneNumber: string,
  defaultCountry: "US" | string = "US"
): boolean => {
  if (!phoneNumber) return false;

  try {
    return isValidPhoneNumber(phoneNumber, defaultCountry as any);
  } catch (error) {
    return false;
  }
};
