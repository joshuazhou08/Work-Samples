import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserManagementTable } from "./UserManagementTable";
import { useAdminTutors, useAdminClients } from "@/hooks/admin_management";
import { useStudents } from "@/hooks/student_management";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/hooks/admin_management", () => ({
  useAdminTutors: jest.fn(),
  useAdminClients: jest.fn(),
}));

jest.mock("@/hooks/student_management", () => ({
  useStudents: jest.fn(),
}));

const mockTutors = [
  {
    id: 1,
    email: "tutor1@test.com",
    first_name: "John",
    last_name: "Doe",
    username: "johndoe",
    user_type: "tutor" as const,
    subjects_taught: "Math, Physics",
    date_joined: "2024-01-01",
  },
];

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
  },
];

const mockStudents = [
  {
    id: 1,
    client: 2,
    first_name: "Bob",
    last_name: "Johnson",
    email: "bob@test.com",
    grade_level: "10th Grade",
    client_name: "Jane Smith",
    is_active: true,
    created_at: "2024-01-03",
    updated_at: "2024-01-03",
  },
];

describe("UserManagementTable - Integration Tests", () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });
    (useAdminTutors as jest.Mock).mockReturnValue({
      data: mockTutors,
      isLoading: false,
      error: null,
    });
    (useAdminClients as jest.Mock).mockReturnValue({
      data: mockClients,
      isLoading: false,
      error: null,
    });
    (useStudents as jest.Mock).mockReturnValue({
      data: { students: mockStudents, count: mockStudents.length },
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading and Error States", () => {
    it("renders loading state", () => {
      (useAdminTutors as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });
      render(<UserManagementTable />);
      expect(screen.getByText("Loading users...")).toBeInTheDocument();
    });

    it("renders error state", () => {
      (useAdminTutors as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: { message: "Failed to load" },
      });
      render(<UserManagementTable />);
      expect(screen.getByText("Error loading users")).toBeInTheDocument();
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
  });

  describe("Tab Navigation", () => {
    it("renders tutors tab by default", () => {
      render(<UserManagementTable />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("tutor1@test.com")).toBeInTheDocument();
    });

    it("switches to clients tab", () => {
      render(<UserManagementTable />);
      fireEvent.click(screen.getByText(/Clients \(1\)/));
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("client1@test.com")).toBeInTheDocument();
    });

    it("switches to students tab", () => {
      render(<UserManagementTable />);
      fireEvent.click(screen.getByText(/Students \(1\)/));
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      expect(screen.getByText("bob@test.com")).toBeInTheDocument();
    });

    it("restores tab from URL parameter", () => {
      mockGet.mockReturnValue("clients");
      render(<UserManagementTable />);
      expect(mockGet).toHaveBeenCalledWith("tab");
    });

    it("defaults to tutors tab when no URL parameter", () => {
      mockGet.mockReturnValue(null);
      render(<UserManagementTable />);
      expect(screen.getByText(/Tutors/)).toBeInTheDocument();
    });
  });

  describe("Tab Counts", () => {
    it("handles undefined data gracefully", () => {
      (useAdminTutors as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });
      (useAdminClients as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });
      (useStudents as jest.Mock).mockReturnValue({
        data: { students: undefined, count: 0 },
        isLoading: false,
        error: null,
      });
      render(<UserManagementTable />);
      expect(screen.getByText("Tutors (0)")).toBeInTheDocument();
      expect(screen.getByText("Clients (0)")).toBeInTheDocument();
      expect(screen.getByText("Students (0)")).toBeInTheDocument();
    });

    it("handles null data gracefully", () => {
      (useAdminTutors as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
      (useAdminClients as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
      (useStudents as jest.Mock).mockReturnValue({
        data: { students: null, count: 0 },
        isLoading: false,
        error: null,
      });
      render(<UserManagementTable />);
      expect(screen.getByText("Tutors (0)")).toBeInTheDocument();
    });

    it("displays correct counts", () => {
      render(<UserManagementTable />);
      expect(screen.getByText("Tutors (1)")).toBeInTheDocument();
      expect(screen.getByText("Clients (1)")).toBeInTheDocument();
      expect(screen.getByText("Students (1)")).toBeInTheDocument();
    });
  });

  describe("Search Integration", () => {
    it("search input is present and functional", async () => {
      render(<UserManagementTable />);
      const searchInput = screen.getByPlaceholderText("Search users...");
      expect(searchInput).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: "john" } });
      await waitFor(() => {
        expect(searchInput).toHaveValue("john");
      });
    });

    it("search persists across tab switches", async () => {
      render(<UserManagementTable />);
      const searchInput = screen.getByPlaceholderText("Search users...");

      fireEvent.change(searchInput, { target: { value: "test" } });

      // Switch tabs
      fireEvent.click(screen.getByText(/Clients \(1\)/));
      expect(searchInput).toHaveValue("test");

      fireEvent.click(screen.getByText(/Students \(1\)/));
      expect(searchInput).toHaveValue("test");
    });
  });

  describe("Header and Layout", () => {
    it("renders page header", () => {
      render(<UserManagementTable />);
      expect(screen.getByText("User Management")).toBeInTheDocument();
      expect(
        screen.getByText("Manage tutors, clients, and students on the platform")
      ).toBeInTheDocument();
    });

    it("renders with proper structure", () => {
      const { container } = render(<UserManagementTable />);
      expect(container.querySelector(".space-y-6")).toBeInTheDocument();
    });
  });
});
