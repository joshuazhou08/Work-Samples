import { adminKeys } from "../keys";

describe("adminKeys", () => {
  describe("all", () => {
    it("returns base admin key", () => {
      expect(adminKeys.all).toEqual(["admin"]);
    });
  });

  describe("tutors", () => {
    it("returns tutors key", () => {
      expect(adminKeys.tutors()).toEqual(["admin", "tutors"]);
    });
  });

  describe("clients", () => {
    it("returns clients key", () => {
      expect(adminKeys.clients()).toEqual(["admin", "clients"]);
    });
  });

  describe("client", () => {
    it("returns specific client key", () => {
      expect(adminKeys.client(1)).toEqual(["admin", "clients", 1]);
    });

    it("works with different client IDs", () => {
      expect(adminKeys.client(42)).toEqual(["admin", "clients", 42]);
    });
  });

  describe("students", () => {
    it("returns students key", () => {
      expect(adminKeys.students()).toEqual(["admin", "students"]);
    });
  });

  describe("student", () => {
    it("returns specific student key", () => {
      expect(adminKeys.student(1)).toEqual(["admin", "students", 1]);
    });

    it("works with different student IDs", () => {
      expect(adminKeys.student(99)).toEqual(["admin", "students", 99]);
    });
  });

  describe("rates", () => {
    it("returns rates key", () => {
      expect(adminKeys.rates()).toEqual(["admin", "rates"]);
    });
  });

  describe("rate", () => {
    it("returns specific rate key", () => {
      expect(adminKeys.rate(1)).toEqual(["admin", "rates", 1]);
    });

    it("works with different rate IDs", () => {
      expect(adminKeys.rate(123)).toEqual(["admin", "rates", 123]);
    });
  });

  describe("studentRates", () => {
    it("returns student-specific rates key", () => {
      expect(adminKeys.studentRates(5)).toEqual([
        "admin",
        "rates",
        "student",
        5,
      ]);
    });

    it("works with different student IDs", () => {
      expect(adminKeys.studentRates(100)).toEqual([
        "admin",
        "rates",
        "student",
        100,
      ]);
    });
  });

  describe("tutorRates", () => {
    it("returns tutor-specific rates key", () => {
      expect(adminKeys.tutorRates(3)).toEqual(["admin", "rates", "tutor", 3]);
    });

    it("works with different tutor IDs", () => {
      expect(adminKeys.tutorRates(77)).toEqual(["admin", "rates", "tutor", 77]);
    });
  });

  describe("tutorPayments", () => {
    it("returns tutor payments key with date range", () => {
      expect(adminKeys.tutorPayments("2024-01-01", "2024-01-31")).toEqual([
        "admin",
        "tutor-payments",
        "2024-01-01",
        "2024-01-31",
      ]);
    });

    it("works with different date ranges", () => {
      expect(adminKeys.tutorPayments("2024-02-01", "2024-02-28")).toEqual([
        "admin",
        "tutor-payments",
        "2024-02-01",
        "2024-02-28",
      ]);
    });

    it("creates same key for same dates", () => {
      const key1 = adminKeys.tutorPayments("2024-01-01", "2024-01-31");
      const key2 = adminKeys.tutorPayments("2024-01-01", "2024-01-31");
      expect(key1).toEqual(key2);
    });
  });
});
