import {
  getLocalDateString,
  isDateInRange,
  filterByDateRange,
} from "./dateFilters";

describe("dateFilters", () => {
  describe("getLocalDateString", () => {
    it("extracts local date from ISO string", () => {
      // This test will pass in any timezone since it uses local date
      const result = getLocalDateString("2024-01-15T10:00:00Z");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("handles different times on same date", () => {
      const morning = getLocalDateString("2024-01-15T08:00:00Z");
      const evening = getLocalDateString("2024-01-15T22:00:00Z");

      // Both should extract to some date (may differ by timezone)
      expect(morning).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(evening).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("isDateInRange", () => {
    it("returns true for date within range", () => {
      // Date in the middle of range
      expect(
        isDateInRange("2024-01-15T12:00:00Z", "2024-01-10", "2024-01-20")
      ).toBe(true);
    });

    it("returns false for date before range", () => {
      expect(
        isDateInRange("2024-01-05T12:00:00Z", "2024-01-10", "2024-01-20")
      ).toBe(false);
    });

    it("returns false for date after range", () => {
      expect(
        isDateInRange("2024-01-25T12:00:00Z", "2024-01-10", "2024-01-20")
      ).toBe(false);
    });

    it("includes start date (inclusive)", () => {
      // Morning of start date
      const result = isDateInRange(
        "2024-01-10T08:00:00Z",
        "2024-01-10",
        "2024-01-20"
      );
      expect(result).toBe(true);
    });

    it("includes end date (inclusive)", () => {
      // Evening of end date
      const result = isDateInRange(
        "2024-01-20T22:00:00Z",
        "2024-01-10",
        "2024-01-20"
      );
      expect(result).toBe(true);
    });

    it("works when start and end date are the same", () => {
      // Same day - should be included
      expect(
        isDateInRange("2024-01-15T12:00:00Z", "2024-01-15", "2024-01-15")
      ).toBe(true);
    });

    it("excludes dates outside single-day range", () => {
      // Day clearly before
      expect(
        isDateInRange("2024-01-14T12:00:00Z", "2024-01-15", "2024-01-15")
      ).toBe(false);
      // Day clearly after
      expect(
        isDateInRange("2024-01-17T12:00:00Z", "2024-01-15", "2024-01-15")
      ).toBe(false);
    });
  });

  describe("filterByDateRange", () => {
    interface TestItem {
      id: number;
      created_at: string;
      name: string;
    }

    const items: TestItem[] = [
      { id: 1, created_at: "2024-01-10T10:00:00Z", name: "Item 1" },
      { id: 2, created_at: "2024-01-15T10:00:00Z", name: "Item 2" },
      { id: 3, created_at: "2024-01-20T10:00:00Z", name: "Item 3" },
      { id: 4, created_at: "2024-01-25T10:00:00Z", name: "Item 4" },
    ];

    it("filters items within range", () => {
      const result = filterByDateRange(
        items,
        (item) => item.created_at,
        "2024-01-12",
        "2024-01-22"
      );

      const ids = result.map((r) => r.id);
      expect(ids).toContain(2); // Jan 15
      expect(ids).toContain(3); // Jan 20
      expect(ids).not.toContain(1); // Jan 10 (before)
      expect(ids).not.toContain(4); // Jan 25 (after)
    });

    it("is inclusive of boundaries", () => {
      const result = filterByDateRange(
        items,
        (item) => item.created_at,
        "2024-01-15",
        "2024-01-20"
      );

      const ids = result.map((r) => r.id);
      expect(ids).toContain(2); // Exactly start date
      expect(ids).toContain(3); // Exactly end date
    });

    it("works with single-day range", () => {
      const result = filterByDateRange(
        items,
        (item) => item.created_at,
        "2024-01-15",
        "2024-01-15"
      );

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(2);
    });

    it("returns empty array when no items in range", () => {
      const result = filterByDateRange(
        items,
        (item) => item.created_at,
        "2024-02-01",
        "2024-02-28"
      );

      expect(result.length).toBe(0);
    });

    it("handles empty input array", () => {
      const result = filterByDateRange(
        [],
        (item: TestItem) => item.created_at,
        "2024-01-01",
        "2024-01-31"
      );

      expect(result.length).toBe(0);
    });
  });
});
