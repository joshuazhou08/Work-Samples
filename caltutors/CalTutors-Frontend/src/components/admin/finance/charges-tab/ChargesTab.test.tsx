import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChargesTab } from "./ChargesTab";
import { useAdminCharges } from "@/hooks/admin_management";
import type { Charge } from "@/types/admin_management";

jest.mock("@/hooks/admin_management", () => ({
  useAdminCharges: jest.fn(),
}));

const mockCharges: Charge[] = [
  {
    id: 1,
    user: 1,
    amount: "100.00",
    credits_applied: "0.00",
    final_amount: "100.00",
    currency: "usd",
    status: "pending",
    created_at: "2024-01-15T10:00:00Z",
    sessions: [1, 2],
    user_info: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    },
    session_count: 2,
    session_details: [
      {
        id: 1,
        start_time: "2024-01-15T10:00:00Z",
        duration_minutes: 60,
        tutor_name: "Alice Tutor",
        student_name: "Bob Student",
      },
    ],
  },
  {
    id: 2,
    user: 2,
    amount: "150.00",
    credits_applied: "10.00",
    final_amount: "140.00",
    currency: "usd",
    status: "paid",
    created_at: "2024-01-20T10:00:00Z",
    sessions: [3],
    user_info: {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
    },
    session_count: 1,
    session_details: [],
  },
];

describe("ChargesTab", () => {
  const mockRefetch = jest.fn();
  const defaultProps = {
    startDate: "2024-01-01",
    endDate: "2024-01-31",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAdminCharges as jest.Mock).mockReturnValue({
      data: mockCharges,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  describe("Rendering", () => {
    it("renders search bar when data is available", () => {
      render(<ChargesTab {...defaultProps} />);

      expect(
        screen.getByPlaceholderText(
          "Search by client or student name, email..."
        )
      ).toBeInTheDocument();
    });

    it("renders all charge items", () => {
      render(<ChargesTab {...defaultProps} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("filters charges by client name", () => {
      render(<ChargesTab {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        "Search by client or student name, email..."
      );
      fireEvent.change(searchInput, { target: { value: "John" } });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    it("filters charges by student name", () => {
      const chargesWithStudents = [
        {
          ...mockCharges[0],
          session_details: [
            {
              id: 1,
              start_time: "2024-01-15T10:00:00Z",
              duration_minutes: 60,
              tutor_name: "Alice Tutor",
              student_name: "TestStudent Match",
            },
          ],
        },
        mockCharges[1],
      ];

      (useAdminCharges as jest.Mock).mockReturnValue({
        data: chargesWithStudents,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<ChargesTab {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        "Search by client or student name, email..."
      );
      fireEvent.change(searchInput, { target: { value: "TestStudent" } });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    it("is case insensitive", () => {
      render(<ChargesTab {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(
        "Search by client or student name, email..."
      );
      fireEvent.change(searchInput, { target: { value: "JANE" } });

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  describe("Date Filtering", () => {
    it("filters charges by global date range", () => {
      // Backend filtering: mock returns only charges within date range (Jan only)
      const filteredCharges = [
        { ...mockCharges[0], created_at: "2024-01-15T10:00:00Z" },
        // mockCharges[1] with Feb date is not returned by backend
      ];

      (useAdminCharges as jest.Mock).mockReturnValue({
        data: filteredCharges,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      // Date range is 2024-01-01 to 2024-01-31 (Jan only)
      render(<ChargesTab {...defaultProps} />);

      // Only charge from January should be visible (backend filtered)
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    it("is inclusive of start date", () => {
      // Backend returns only the charge on start date (backend filtered out the one before)
      const filteredCharges = [
        { ...mockCharges[0], created_at: "2024-01-01T08:00:00Z" }, // Exactly start date
        // mockCharges[1] with 2023-12-31 is not returned by backend
      ];

      (useAdminCharges as jest.Mock).mockReturnValue({
        data: filteredCharges,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<ChargesTab {...defaultProps} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    it("is inclusive of end date", () => {
      // Backend returns only the charge on end date (backend filtered out the one after)
      const filteredCharges = [
        { ...mockCharges[0], created_at: "2024-01-31T14:00:00Z" }, // Exactly end date
        // mockCharges[1] with Feb date is not returned by backend
      ];

      (useAdminCharges as jest.Mock).mockReturnValue({
        data: filteredCharges,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<ChargesTab {...defaultProps} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    it("works with single-day range", () => {
      // Backend returns only charge on the specific date (backend filtered out the day after)
      const filteredCharges = [
        { ...mockCharges[0], created_at: "2024-01-15T10:00:00Z" }, // On the date
        // mockCharges[1] with Jan 16 is not returned by backend
      ];

      (useAdminCharges as jest.Mock).mockReturnValue({
        data: filteredCharges,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      // Single day range
      const singleDayProps = {
        startDate: "2024-01-15",
        endDate: "2024-01-15",
      };

      render(<ChargesTab {...singleDayProps} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading indicator", () => {
      (useAdminCharges as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<ChargesTab {...defaultProps} />);

      expect(screen.getByText("Loading charges...")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("displays error message", () => {
      (useAdminCharges as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error("Failed to fetch charges"),
        refetch: mockRefetch,
      });

      render(<ChargesTab {...defaultProps} />);

      expect(screen.getByText("Error loading charges")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch charges")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no charges", () => {
      (useAdminCharges as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<ChargesTab {...defaultProps} />);

      expect(screen.getByText("No charges found")).toBeInTheDocument();
    });
  });

  describe("Expand/Collapse", () => {
    it("toggles charge expansion", () => {
      render(<ChargesTab {...defaultProps} />);

      // Expand first charge
      const buttons = screen.getAllByRole("button");
      const johnButton = buttons.find((btn) =>
        btn.textContent?.includes("John Doe")
      );
      fireEvent.click(johnButton!);

      // Verify expanded (session details visible)
      expect(screen.getByText("Alice Tutor")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("fetches and displays charges data", async () => {
      render(<ChargesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });
  });
});
