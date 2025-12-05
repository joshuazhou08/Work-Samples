import {
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
} from "./formatters";

describe("formatters", () => {
  describe("formatCurrency", () => {
    it("should format a number as USD currency", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });

    it("should format a string number as USD currency", () => {
      expect(formatCurrency("1234.56")).toBe("$1,234.56");
      expect(formatCurrency("0")).toBe("$0.00");
      expect(formatCurrency("99.99")).toBe("$99.99");
    });

    it("should handle negative numbers", () => {
      expect(formatCurrency(-50)).toBe("-$50.00");
      expect(formatCurrency("-75.25")).toBe("-$75.25");
    });

    it("should round to 2 decimal places", () => {
      expect(formatCurrency(10.999)).toBe("$11.00");
      expect(formatCurrency(10.001)).toBe("$10.00");
    });
  });

  describe("formatDate", () => {
    it("should format ISO date string correctly", () => {
      const result = formatDate("2024-01-15T10:30:00Z");
      // Note: The exact format depends on timezone, but should match the pattern
      expect(result).toMatch(/Jan \d{1,2}, 2024/);
    });

    it("should handle different date formats", () => {
      const result = formatDate("2024-12-25T00:00:00Z");
      expect(result).toMatch(/Dec \d{1,2}, 2024/);
    });
  });

  describe("formatTime", () => {
    it("should format time correctly", () => {
      const result = formatTime("2024-01-15T14:30:00Z");
      // Result will vary by timezone, but should be in 12-hour format
      expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it("should handle midnight and noon", () => {
      const midnight = formatTime("2024-01-15T00:00:00Z");
      const noon = formatTime("2024-01-15T12:00:00Z");

      expect(midnight).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
      expect(noon).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });

  describe("formatDateTime", () => {
    it("should combine date and time formatting", () => {
      const result = formatDateTime("2024-01-15T14:30:00Z");
      expect(result).toMatch(/Jan \d{1,2}, 2024 \d{1,2}:\d{2} (AM|PM)/);
    });

    it("should handle different dates", () => {
      const result = formatDateTime("2024-12-31T23:59:00Z");
      expect(result).toMatch(/Dec \d{1,2}, 2024 \d{1,2}:\d{2} (AM|PM)/);
    });
  });
});
