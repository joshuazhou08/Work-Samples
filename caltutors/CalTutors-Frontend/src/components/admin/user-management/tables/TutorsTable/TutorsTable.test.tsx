import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { TutorsTable } from "./TutorsTable";
import { useAdminTutors } from "@/hooks/admin_management";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/admin_management", () => ({
  useAdminTutors: jest.fn(),
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
    hasActiveStudents: true,
    billing_status: "valid",
    is_recently_active: true,
    notices: [],
  },
  {
    id: 2,
    email: "tutor2@test.com",
    first_name: "Alice",
    last_name: "Smith",
    username: "alicesmith",
    user_type: "tutor" as const,
    subjects_taught: "English",
    date_joined: "2024-01-02",
    hasActiveStudents: false,
    billing_status: "invalid",
    is_recently_active: false,
    notices: ["No students", "Missing billing"],
  },
];

describe("TutorsTable", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAdminTutors as jest.Mock).mockReturnValue({
      data: mockTutors,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders tutors data", () => {
    render(<TutorsTable searchTerm="" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("tutor1@test.com")).toBeInTheDocument();
  });

  it("filters tutors by search term - name", () => {
    render(<TutorsTable searchTerm="john" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("filters tutors by search term - subjects", () => {
    render(<TutorsTable searchTerm="physics" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("navigates to tutor detail with correct URL parameters", () => {
    render(<TutorsTable searchTerm="" />);
    fireEvent.click(screen.getByText("John Doe"));
    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/user-management/1?type=tutor&from=tutors"
    );
  });

  it("filters tutors with no students using hasActiveStudents field", () => {
    render(<TutorsTable searchTerm="" />);

    // Initially, both tutors should be visible
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();

    // Enable the "no students" filter
    const checkbox = screen.getByLabelText("Show only tutors with no students");
    fireEvent.click(checkbox);

    // Only tutor without students should be visible (Alice Smith)
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("shows notices column correctly", () => {
    render(<TutorsTable searchTerm="" />);
    expect(screen.getByText("No students")).toBeInTheDocument();
    expect(screen.getByText("Missing billing")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("handles undefined data gracefully", () => {
    (useAdminTutors as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<TutorsTable searchTerm="" />);
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("returns null when loading", () => {
    (useAdminTutors as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });
    const { container } = render(<TutorsTable searchTerm="" />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when error", () => {
    (useAdminTutors as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: { message: "Failed to load" },
    });
    const { container } = render(<TutorsTable searchTerm="" />);
    expect(container.firstChild).toBeNull();
  });
});
