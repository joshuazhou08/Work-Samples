import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { ClientsTable } from "./ClientsTable";
import { useAdminClients } from "@/hooks/admin_management";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/admin_management", () => ({
  useAdminClients: jest.fn(),
}));

const mockClients = [
  {
    id: 2,
    email: "client1@test.com",
    first_name: "Jane",
    last_name: "Smith",
    username: "janesmith",
    user_type: "client" as const,
    balance: "100.00",
    date_joined: "2024-01-02",
    hasStudents: true,
    billing_status: "valid",
    is_recently_active: true,
    notices: [],
  },
  {
    id: 3,
    email: "client2@test.com",
    first_name: "Bob",
    last_name: "Jones",
    username: "bobjones",
    user_type: "client" as const,
    balance: "50.00",
    date_joined: "2024-01-03",
    hasStudents: false,
    billing_status: "invalid",
    is_recently_active: false,
    notices: ["No students", "Missing billing"],
  },
];

describe("ClientsTable", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAdminClients as jest.Mock).mockReturnValue({
      data: mockClients,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders clients data", () => {
    render(<ClientsTable searchTerm="" />);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("client1@test.com")).toBeInTheDocument();
  });

  it("filters clients by search term - name", () => {
    render(<ClientsTable searchTerm="jane" />);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });

  it("navigates to client detail with correct URL parameters", () => {
    render(<ClientsTable searchTerm="" />);
    fireEvent.click(screen.getByText("Jane Smith"));
    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/user-management/2?type=client&from=clients"
    );
  });

  it("filters clients with no students using hasStudents field", () => {
    render(<ClientsTable searchTerm="" />);

    // Initially, both clients should be visible
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();

    // Enable the "no students" filter
    const checkbox = screen.getByLabelText("Show only clients with no students");
    fireEvent.click(checkbox);

    // Only client without students should be visible (Bob Jones)
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows notices column correctly", () => {
    render(<ClientsTable searchTerm="" />);
    expect(screen.getByText("No students")).toBeInTheDocument();
    expect(screen.getByText("Missing billing")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("handles undefined data gracefully", () => {
    (useAdminClients as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<ClientsTable searchTerm="" />);
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("returns null when loading", () => {
    (useAdminClients as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });
    const { container } = render(<ClientsTable searchTerm="" />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when error", () => {
    (useAdminClients as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: { message: "Failed to load" },
    });
    const { container } = render(<ClientsTable searchTerm="" />);
    expect(container.firstChild).toBeNull();
  });
});
