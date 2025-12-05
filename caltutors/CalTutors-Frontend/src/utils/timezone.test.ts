import {
  convertLocalToUTC,
  convertUTCToLocal,
  formatLocalTime,
  formatLocalDate,
} from "./timezone";

describe("timezone utilities", () => {
  describe("convertLocalToUTC", () => {
    it("converts local date and time to UTC ISO string", () => {
      const result = convertLocalToUTC("2025-10-24", "14:30");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("handles different times", () => {
      const result = convertLocalToUTC("2025-12-31", "23:45");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe("convertUTCToLocal", () => {
    it("converts UTC string to local Date object", () => {
      const utcString = "2025-10-24T14:30:00.000Z";
      const result = convertUTCToLocal(utcString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(utcString);
    });
  });

  describe("formatLocalTime", () => {
    it("formats time as HH:mm", () => {
      const date = new Date(2025, 9, 24, 14, 30, 0);
      const result = formatLocalTime(date);
      expect(result).toBe("14:30");
    });

    it("pads single digit hours and minutes", () => {
      const date = new Date(2025, 9, 24, 9, 5, 0);
      const result = formatLocalTime(date);
      expect(result).toBe("09:05");
    });
  });

  describe("formatLocalDate", () => {
    it("formats date as YYYY-MM-DD", () => {
      const date = new Date(2025, 9, 24);
      const result = formatLocalDate(date);
      expect(result).toBe("2025-10-24");
    });

    it("pads single digit months and days", () => {
      const date = new Date(2025, 0, 5);
      const result = formatLocalDate(date);
      expect(result).toBe("2025-01-05");
    });
  });
});
