import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TutorPaymentsTab } from "./TutorPaymentsTab";
import { useTutorPayments } from "@/hooks/admin_management";
import type { TutorPayment } from "@/types/admin_management";

jest.mock("@/hooks/admin_management", () => ({
  useTutorPayments: jest.fn(),
}));

const mockTutorPayments: TutorPayment[] = [
  {
    tutor: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    },
    total_amount: "150.00",
    session_count: 3,
    sessions: [
      {
        id: 1,
        student_name: "Alice Student",
        start_time: "2024-01-15T10:00:00Z", // Within default date range (Jan 2024)
        duration_minutes: 60,
        tutor_pay_rate: "50.00",
        session_amount: "50.00",
      },
      {
        id: 2,
        student_name: "Bob Student",
        start_time: "2024-01-20T10:00:00Z", // Within default date range
        duration_minutes: 90,
        tutor_pay_rate: "50.00",
        session_amount: "75.00",
      },
      {
        id: 3,
        student_name: "Charlie Student",
        start_time: "2024-01-25T10:00:00Z", // Within default date range
        duration_minutes: 60,
        tutor_pay_rate: "50.00",
        session_amount: "50.00",
      },
    ],
  },
  {
    tutor: {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
    },
    total_amount: "200.00",
    session_count: 2,
    sessions: [
      {
        id: 4,
        student_name: "David Student",
        start_time: "2024-01-18T10:00:00Z", // Within default date range
        duration_minutes: 120,
        tutor_pay_rate: "50.00",
        session_amount: "100.00",
      },
      {
        id: 5,
        student_name: "Emma Student",
        start_time: "2024-01-22T10:00:00Z", // Within default date range
        duration_minutes: 120,
        tutor_pay_rate: "50.00",
        session_amount: "100.00",
      },
    ],
  },
];

describe("TutorPaymentsTab", () => {
  const mockRefetch = jest.fn();
  const defaultProps = {
    startDate: "2024-01-01",
    endDate: "2024-01-31",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTutorPayments as jest.Mock).mockReturnValue({
      data: mockTutorPayments,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  describe("Rendering", () => {
    it("renders search bar when data is available", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      expect(
        screen.getByPlaceholderText("Search tutors by name or email...")
      ).toBeInTheDocument();
    });

    it("renders all tutor payment items", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading indicator", () => {
      (useTutorPayments as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<TutorPaymentsTab {...defaultProps} />);

      expect(screen.getByText("Loading tutor payments...")).toBeInTheDocument();
    });

    it("does not show search or data when loading", () => {
      (useTutorPayments as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<TutorPaymentsTab {...defaultProps} />);

      expect(
        screen.queryByPlaceholderText("Search tutors by name or email...")
      ).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("displays error message", () => {
      (useTutorPayments as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error("Failed to fetch payments"),
        refetch: mockRefetch,
      });

      render(<TutorPaymentsTab {...defaultProps} />);

      expect(
        screen.getByText("Error loading tutor payments")
      ).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch payments")).toBeInTheDocument();
    });

    it("does not show data when error occurs", () => {
      (useTutorPayments as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error("Failed to fetch"),
        refetch: mockRefetch,
      });

      render(<TutorPaymentsTab {...defaultProps} />);

      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no data", () => {
      (useTutorPayments as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TutorPaymentsTab {...defaultProps} />);

      expect(
        screen.getByText("No tutor payments data available")
      ).toBeInTheDocument();
    });

    it("does not show search bar when no data", () => {
      (useTutorPayments as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TutorPaymentsTab {...defaultProps} />);

      expect(
        screen.queryByPlaceholderText("Search tutors by name or email...")
      ).not.toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("filters tutors by first name", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        "Search tutors by name or email..."
      );
      fireEvent.change(searchInput, { target: { value: "John" } });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    it("filters tutors by last name", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        "Search tutors by name or email..."
      );
      fireEvent.change(searchInput, { target: { value: "Smith" } });

      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("filters tutors by email", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        "Search tutors by name or email..."
      );
      fireEvent.change(searchInput, { target: { value: "jane@example" } });

      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("is case insensitive", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        "Search tutors by name or email..."
      );
      fireEvent.change(searchInput, { target: { value: "JOHN" } });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("shows no results message when search has no matches", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        "Search tutors by name or email..."
      );
      fireEvent.change(searchInput, { target: { value: "NonExistent" } });

      expect(
        screen.getByText(/No tutors found matching "NonExistent"/)
      ).toBeInTheDocument();
    });
  });

  describe("Expand/Collapse Functionality", () => {
    it("toggles tutor expansion when item is clicked", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      // Find the tutor payment item button (not date/refresh buttons)
      const tutorButton = buttons.find((btn) =>
        btn.textContent?.includes("John Doe")
      );

      expect(tutorButton).toBeDefined();
      fireEvent.click(tutorButton!);

      // After clicking, sessions should be visible
      expect(screen.getByText("Alice Student")).toBeInTheDocument();
    });

    it("maintains expanded state across search", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      // Expand John Doe
      const buttons = screen.getAllByRole("button");
      const johnButton = buttons.find((btn) =>
        btn.textContent?.includes("John Doe")
      );
      fireEvent.click(johnButton!);

      // Verify expanded (session details visible)
      expect(screen.getByText("Alice Student")).toBeInTheDocument();

      // Search for John
      const searchInput = screen.getByPlaceholderText(
        "Search tutors by name or email..."
      );
      fireEvent.change(searchInput, { target: { value: "John" } });

      // Jane should be filtered out
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
      // John should still be expanded
      expect(screen.getByText("Alice Student")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("fetches and displays tutor payments data", async () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });

    it("calls useTutorPayments hook", () => {
      render(<TutorPaymentsTab {...defaultProps} />);

      // Verify hook was called
      expect(useTutorPayments).toHaveBeenCalled();
    });
  });
});
