import { sessionKeys } from "../keys";

describe("sessionKeys", () => {
  describe("all", () => {
    it("returns base sessions key", () => {
      expect(sessionKeys.all).toEqual(["sessions"]);
    });
  });

  describe("list", () => {
    it("returns sessions list key without filters", () => {
      expect(sessionKeys.list()).toEqual(["sessions", "list"]);
    });

    it("returns sessions list key with filters", () => {
      const filters = { tutor_id: 1, student_id: 2 };
      expect(sessionKeys.list(filters)).toEqual(["sessions", "list", filters]);
    });
  });

  describe("detail", () => {
    it("returns specific session detail key", () => {
      expect(sessionKeys.detail(1)).toEqual(["sessions", "detail", 1]);
    });

    it("works with different session IDs", () => {
      expect(sessionKeys.detail(42)).toEqual(["sessions", "detail", 42]);
    });
  });

  describe("upcomingSessions", () => {
    it("returns upcoming sessions key", () => {
      expect(sessionKeys.upcomingSessions()).toEqual(["sessions", "upcoming"]);
    });
  });

  describe("sessionStats", () => {
    it("returns session stats key", () => {
      expect(sessionKeys.sessionStats()).toEqual(["sessions", "stats"]);
    });
  });

  describe("availableStudents", () => {
    it("returns available students key", () => {
      expect(sessionKeys.availableStudents()).toEqual([
        "sessions",
        "available-students",
      ]);
    });
  });

  describe("rates", () => {
    it("returns rates key", () => {
      expect(sessionKeys.rates()).toEqual(["sessions", "rates"]);
    });
  });

  describe("studentRates", () => {
    it("returns student-specific rates key", () => {
      expect(sessionKeys.studentRates(5)).toEqual([
        "sessions",
        "rates",
        "student",
        5,
      ]);
    });

    it("works with different student IDs", () => {
      expect(sessionKeys.studentRates(100)).toEqual([
        "sessions",
        "rates",
        "student",
        100,
      ]);
    });
  });

  describe("tutorRates", () => {
    it("returns tutor-specific rates key", () => {
      expect(sessionKeys.tutorRates(3)).toEqual([
        "sessions",
        "rates",
        "tutor",
        3,
      ]);
    });

    it("works with different tutor IDs", () => {
      expect(sessionKeys.tutorRates(77)).toEqual([
        "sessions",
        "rates",
        "tutor",
        77,
      ]);
    });
  });
});
