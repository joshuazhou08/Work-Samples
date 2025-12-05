import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UnchargedSessionsTab } from "./UnchargedSessionsTab";
import { useUnchargedSessions } from "@/hooks/admin_management";
import type { UnchargedSessionGroup } from "@/types/admin_management";

jest.mock("@/hooks/admin_management", () => ({
  useUnchargedSessions: jest.fn(),
}));

const mockGroups: UnchargedSessionGroup[] = [
  {
    student: {
      id: 1,
      first_name: "Emma",
      last_name: "Williams",
      email: "emma@test.com",
      phone_number: "",
      grade_level: "10th Grade",
    },
    client: {
      id: 2,
      first_name: "Mary",
      last_name: "Williams",
      email: "mary@test.com",
      phone_number: "+15550000001",
    },
    sessions: [
      {
        id: 1,
        tutor_name: "Alice Tutor",
        start_time: "2024-01-15T10:00:00Z",
        duration_minutes: 60,
      },
      {
        id: 2,
        tutor_name: "Bob Tutor",
        start_time: "2024-01-16T10:00:00Z",
        duration_minutes: 90,
      },
    ],
  },
  {
    student: {
      id: 2,
      first_name: "Oliver",
      last_name: "Davis",
      email: "oliver@test.com",
      phone_number: "",
      grade_level: "9th Grade",
    },
    client: {
      id: 3,
      first_name: "John",
      last_name: "Davis",
      email: "john@test.com",
      phone_number: "+15550000002",
    },
    sessions: [
      {
        id: 3,
        tutor_name: "Charlie Tutor",
        start_time: "2024-01-17T10:00:00Z",
        duration_minutes: 120,
      },
    ],
  },
];

describe("UnchargedSessionsTab", () => {
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUnchargedSessions as jest.Mock).mockReturnValue({
      data: mockGroups,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  describe("Rendering", () => {
    it("renders search bar when data is available", () => {
      render(<UnchargedSessionsTab />);

      expect(
        screen.getByPlaceholderText(
          "Search by student name, client name, or email..."
        )
      ).toBeInTheDocument();
    });

    it("renders student groups", () => {
      render(<UnchargedSessionsTab />);

      // Verify student groups are rendered
      expect(screen.getByText("Emma Williams")).toBeInTheDocument();
      expect(screen.getByText("Oliver Davis")).toBeInTheDocument();
    });

    it("renders all student groups", () => {
      render(<UnchargedSessionsTab />); 

      expect(screen.getByText("Emma Williams")).toBeInTheDocument();
      expect(screen.getByText("Oliver Davis")).toBeInTheDocument();
    });

    it("renders CSV export button", () => {
      render(<UnchargedSessionsTab />);

      expect(
        screen.getByRole("button", { name: /Export CSV/i })
      ).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading indicator", () => {
      (useUnchargedSessions as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<UnchargedSessionsTab />);

      expect(
        screen.getByText("Loading uncharged sessions...")
      ).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("displays error message", () => {
      (useUnchargedSessions as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error("Failed to fetch sessions"),
        refetch: mockRefetch,
      });

      render(<UnchargedSessionsTab />);

      expect(
        screen.getByText("Error loading uncharged sessions")
      ).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch sessions")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no uncharged sessions", () => {
      (useUnchargedSessions as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<UnchargedSessionsTab />);

      expect(
        screen.getByText("No uncharged sessions found")
      ).toBeInTheDocument();
      expect(
        screen.getByText("All sessions have been charged")
      ).toBeInTheDocument();
    });

    it("does not show search bar when no data", () => {
      (useUnchargedSessions as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<UnchargedSessionsTab />);

      expect(
        screen.queryByPlaceholderText(
          "Search by student name, client name, or email..."
        )
      ).not.toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("filters by student name", () => {
      render(<UnchargedSessionsTab />);

      const searchInput = screen.getByPlaceholderText(
        "Search by student name, client name, or email..."
      );
      fireEvent.change(searchInput, { target: { value: "Emma" } });

      expect(screen.getByText("Emma Williams")).toBeInTheDocument();
      expect(screen.queryByText("Oliver Davis")).not.toBeInTheDocument();
    });

    it("filters by client name", () => {
      render(<UnchargedSessionsTab />);

      const searchInput = screen.getByPlaceholderText(
        "Search by student name, client name, or email..."
      );
      fireEvent.change(searchInput, { target: { value: "John Davis" } });

      expect(screen.queryByText("Emma Williams")).not.toBeInTheDocument();
      expect(screen.getByText("Oliver Davis")).toBeInTheDocument();
    });

    it("filters by email", () => {
      render(<UnchargedSessionsTab />);

      const searchInput = screen.getByPlaceholderText(
        "Search by student name, client name, or email..."
      );
      fireEvent.change(searchInput, { target: { value: "oliver@test" } });

      expect(screen.queryByText("Emma Williams")).not.toBeInTheDocument();
      expect(screen.getByText("Oliver Davis")).toBeInTheDocument();
    });

    it("is case insensitive", () => {
      render(<UnchargedSessionsTab />);

      const searchInput = screen.getByPlaceholderText(
        "Search by student name, client name, or email..."
      );
      fireEvent.change(searchInput, { target: { value: "EMMA" } });

      expect(screen.getByText("Emma Williams")).toBeInTheDocument();
    });

    it("shows no results message", () => {
      render(<UnchargedSessionsTab />);

      const searchInput = screen.getByPlaceholderText(
        "Search by student name, client name, or email..."
      );
      fireEvent.change(searchInput, { target: { value: "NonExistent" } });

      expect(
        screen.getByText(/No students found matching "NonExistent"/)
      ).toBeInTheDocument();
    });

    it("disables CSV export button when no matching clients", () => {
      render(<UnchargedSessionsTab />);

      const searchInput = screen.getByPlaceholderText(
        "Search by student name, client name, or email..."
      );
      fireEvent.change(searchInput, { target: { value: "NonExistent" } });

      expect(
        screen.getByRole("button", { name: /Export CSV/i })
      ).toBeDisabled();
    });
  });

  describe("Expand/Collapse", () => {
    it("toggles student expansion", () => {
      render(<UnchargedSessionsTab />);

      const buttons = screen.getAllByRole("button");
      const emmaButton = buttons.find((btn) =>
        btn.textContent?.includes("Emma Williams")
      );

      fireEvent.click(emmaButton!);

      expect(screen.getByText("Alice Tutor")).toBeInTheDocument();
    });

    it("maintains expanded state across search", () => {
      render(<UnchargedSessionsTab />);

      // Expand Emma
      const buttons = screen.getAllByRole("button");
      const emmaButton = buttons.find((btn) =>
        btn.textContent?.includes("Emma Williams")
      );
      fireEvent.click(emmaButton!);

      // Verify expanded
      expect(screen.getByText("Alice Tutor")).toBeInTheDocument();

      // Search for Emma
      const searchInput = screen.getByPlaceholderText(
        "Search by student name, client name, or email..."
      );
      fireEvent.change(searchInput, { target: { value: "Emma" } });

      // Should still be expanded
      expect(screen.getByText("Alice Tutor")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("fetches and displays uncharged sessions", async () => {
      render(<UnchargedSessionsTab />);

      await waitFor(() => {
        expect(screen.getByText("Emma Williams")).toBeInTheDocument();
        expect(screen.getByText("Oliver Davis")).toBeInTheDocument();
      });
    });
  });
});
