import {
  validateField,
  validateStep,
  validateForm,
  calculatePasswordStrength,
} from "./RegisterForm.validation";
import { FormData } from "../RegisterForm.types";

describe("RegisterForm validation", () => {
  const mockFormData: FormData = {
    email: "test@example.com",
    password: "Password123!",
    password_confirm: "Password123!",
    first_name: "John",
    last_name: "Doe",
    username: "johndoe",
    phone_number: "(415) 555-0100",
    user_type: "client",
  };

  describe("validateField", () => {
    it("validates email field correctly", () => {
      expect(validateField("email", { ...mockFormData, email: "" })).toBe(
        "Email is required"
      );
      expect(
        validateField("email", { ...mockFormData, email: "invalid" })
      ).toBe("Please enter a valid email address");
      expect(validateField("email", mockFormData)).toBe("");
    });

    it("validates password field correctly", () => {
      expect(validateField("password", { ...mockFormData, password: "" })).toBe(
        "Password is required"
      );
      expect(
        validateField("password", { ...mockFormData, password: "short" })
      ).toBe("Password must be at least 8 characters long");
      expect(validateField("password", mockFormData)).toBe("");
    });

    it("validates password confirmation correctly", () => {
      expect(
        validateField("password_confirm", {
          ...mockFormData,
          password_confirm: "",
        })
      ).toBe("Please confirm your password");
      expect(
        validateField("password_confirm", {
          ...mockFormData,
          password_confirm: "different",
        })
      ).toBe("Passwords do not match");
      expect(validateField("password_confirm", mockFormData)).toBe("");
    });

    it("validates name fields correctly", () => {
      expect(
        validateField("first_name", { ...mockFormData, first_name: "" })
      ).toBe("First name is required");
      expect(
        validateField("last_name", { ...mockFormData, last_name: "  " })
      ).toBe("Last name is required");
      expect(validateField("first_name", mockFormData)).toBe("");
      expect(validateField("last_name", mockFormData)).toBe("");
    });

    it("validates username field correctly", () => {
      expect(validateField("username", { ...mockFormData, username: "" })).toBe(
        "Username is required"
      );
      expect(
        validateField("username", { ...mockFormData, username: "ab" })
      ).toBe("Username must be at least 3 characters long");
      expect(
        validateField("username", { ...mockFormData, username: "user@name" })
      ).toBe("Username can only contain letters, numbers, and underscores");
      expect(validateField("username", mockFormData)).toBe("");
    });

    it("validates phone number field correctly", () => {
      expect(
        validateField("phone_number", { ...mockFormData, phone_number: "" })
      ).toBe("Phone number is required");
      expect(
        validateField("phone_number", { ...mockFormData, phone_number: "123" })
      ).toBe("Please enter a valid phone number");
      expect(validateField("phone_number", mockFormData)).toBe("");
    });
  });

  describe("validateStep", () => {
    it("validates step fields and returns errors", () => {
      const stepFields: (keyof FormData)[] = ["first_name", "last_name"];
      const invalidData = { ...mockFormData, first_name: "", last_name: "" };

      const errors = validateStep(stepFields, invalidData);

      expect(errors.first_name).toBe("First name is required");
      expect(errors.last_name).toBe("Last name is required");
      expect(Object.keys(errors)).toHaveLength(2);
    });

    it("returns empty object when step is valid", () => {
      const stepFields: (keyof FormData)[] = ["first_name", "last_name"];
      const errors = validateStep(stepFields, mockFormData);

      expect(errors).toEqual({});
    });
  });

  describe("validateForm", () => {
    it("validates entire form and returns all errors", () => {
      const invalidData: FormData = {
        email: "",
        password: "short",
        password_confirm: "",
        first_name: "",
        last_name: "",
        username: "ab",
        phone_number: "",
        user_type: "client",
      };

      const errors = validateForm(invalidData);

      expect(errors.email).toBe("Email is required");
      expect(errors.password).toBe(
        "Password must be at least 8 characters long"
      );
      expect(errors.password_confirm).toBe("Please confirm your password");
      expect(errors.first_name).toBe("First name is required");
      expect(errors.last_name).toBe("Last name is required");
      expect(errors.username).toBe(
        "Username must be at least 3 characters long"
      );
      expect(errors.phone_number).toBe("Phone number is required");
    });

    it("returns empty object when form is valid", () => {
      const errors = validateForm(mockFormData);
      expect(errors).toEqual({});
    });
  });

  describe("calculatePasswordStrength", () => {
    it("returns empty label for empty password", () => {
      const strength = calculatePasswordStrength("");
      expect(strength.label).toBe("");
      expect(strength.score).toBe(0);
    });

    it("returns weak for passwords with few requirements", () => {
      const strength = calculatePasswordStrength("password");
      expect(strength.label).toBe("weak");
      expect(strength.score).toBe(2);
      expect(strength.requirements.length).toBe(true);
      expect(strength.requirements.lowercase).toBe(true);
      expect(strength.requirements.uppercase).toBe(false);
    });

    it("returns fair for passwords with 3 requirements", () => {
      const strength = calculatePasswordStrength("password1");
      expect(strength.label).toBe("fair");
      expect(strength.score).toBe(3);
    });

    it("returns good for passwords with 4 requirements", () => {
      const strength = calculatePasswordStrength("Password123");
      expect(strength.label).toBe("good");
      expect(strength.score).toBe(4);
    });

    it("returns strong for passwords with all requirements", () => {
      const strength = calculatePasswordStrength("Password123!");
      expect(strength.label).toBe("strong");
      expect(strength.score).toBe(5);
      expect(strength.requirements.length).toBe(true);
      expect(strength.requirements.uppercase).toBe(true);
      expect(strength.requirements.lowercase).toBe(true);
      expect(strength.requirements.number).toBe(true);
      expect(strength.requirements.special).toBe(true);
    });
  });
});
