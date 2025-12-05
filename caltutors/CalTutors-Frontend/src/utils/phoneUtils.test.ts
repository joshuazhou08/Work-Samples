import {
  formatPhoneNumber,
  convertToE164,
  validatePhoneNumber,
} from "./phoneUtils";

describe("phoneUtils", () => {
  describe("formatPhoneNumber", () => {
    it("formats US phone numbers as user types", () => {
      expect(formatPhoneNumber("415", "US")).toBe("(415)");
      expect(formatPhoneNumber("4155", "US")).toBe("(415) 5");
      expect(formatPhoneNumber("4155550", "US")).toBe("(415) 555-0");
      expect(formatPhoneNumber("4155550100", "US")).toBe("(415) 555-0100");
    });

    it("handles international numbers with + prefix", () => {
      expect(formatPhoneNumber("+44", "US")).toBe("+44");
      expect(formatPhoneNumber("+442012345678", "US")).toBe("+44 20 1234 5678");
    });

    it("returns empty string for empty input", () => {
      expect(formatPhoneNumber("", "US")).toBe("");
    });

    it("handles partially entered numbers gracefully", () => {
      expect(formatPhoneNumber("4", "US")).toBe("4");
      expect(formatPhoneNumber("41", "US")).toBe("41");
    });
  });

  describe("convertToE164", () => {
    it("converts US phone numbers to E.164 format", () => {
      expect(convertToE164("4155550100", "US")).toBe("+14155550100");
      expect(convertToE164("(415) 555-0100", "US")).toBe("+14155550100");
      expect(convertToE164("415-555-0100", "US")).toBe("+14155550100");
    });

    it("preserves already formatted E.164 numbers", () => {
      expect(convertToE164("+14155550100", "US")).toBe("+14155550100");
      expect(convertToE164("+442012345678", "US")).toBe("+442012345678");
    });

    it("handles numbers with extra formatting characters", () => {
      expect(convertToE164("+1 (415) 555-0100", "US")).toBe("+14155550100");
      expect(convertToE164("+44 20 1234 5678", "US")).toBe("+442012345678");
    });

    it("returns empty string for empty input", () => {
      expect(convertToE164("", "US")).toBe("");
    });

    it("handles international numbers", () => {
      expect(convertToE164("+442012345678", "US")).toBe("+442012345678");
      expect(convertToE164("442012345678", "GB")).toBe("+442012345678");
    });
  });

  describe("validatePhoneNumber", () => {
    it("validates US phone numbers", () => {
      expect(validatePhoneNumber("4155550100", "US")).toBe(true);
      expect(validatePhoneNumber("(415) 555-0100", "US")).toBe(true);
      expect(validatePhoneNumber("+14155550100", "US")).toBe(true);
    });

    it("rejects invalid US phone numbers", () => {
      expect(validatePhoneNumber("123", "US")).toBe(false);
      expect(validatePhoneNumber("12345", "US")).toBe(false);
      expect(validatePhoneNumber("abc", "US")).toBe(false);
    });

    it("validates international phone numbers", () => {
      expect(validatePhoneNumber("+442012345678", "GB")).toBe(true);
      expect(validatePhoneNumber("+33123456789", "FR")).toBe(true);
    });

    it("returns false for empty input", () => {
      expect(validatePhoneNumber("", "US")).toBe(false);
    });

    it("validates phone numbers with various formats", () => {
      expect(validatePhoneNumber("415-555-0100", "US")).toBe(true);
      expect(validatePhoneNumber("(415) 555-0100", "US")).toBe(true);
      expect(validatePhoneNumber("415.555.0100", "US")).toBe(true);
    });
  });
});
