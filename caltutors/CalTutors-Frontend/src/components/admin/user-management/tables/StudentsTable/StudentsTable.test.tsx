import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { StudentsTable } from "./StudentsTable";
import { useStudents } from "@/hooks/student_management";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/student_management", () => ({
  useStudents: jest.fn(),
}));

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
    hasTutors: true,
  },
  {
    id: 2,
    client: 3,
    first_name: "Sally",
    last_name: "Brown",
    email: "sally@test.com",
    grade_level: "9th Grade",
    client_name: "Bob Jones",
    is_active: true,
    created_at: "2024-01-04",
    updated_at: "2024-01-04",
    hasTutors: false,
  },
];

describe("StudentsTable", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useStudents as jest.Mock).mockReturnValue({
      data: { students: mockStudents, count: mockStudents.length },
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders students data", () => {
    render(<StudentsTable searchTerm="" />);
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
  });

  it("filters students by search term - name", () => {
    render(<StudentsTable searchTerm="johnson" />);
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    expect(screen.queryByText("Sally Brown")).not.toBeInTheDocument();
  });

  it("filters students by search term - client name", () => {
    render(<StudentsTable searchTerm="jane smith" />);
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    expect(screen.queryByText("Sally Brown")).not.toBeInTheDocument();
  });

  it("navigates to student detail with correct URL parameters", () => {
    render(<StudentsTable searchTerm="" />);
    fireEvent.click(screen.getByText("Bob Johnson"));
    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/user-management/1?type=student&from=students"
    );
  });

  it("filters students with no tutors using hasTutors field", () => {
    render(<StudentsTable searchTerm="" />);

    // Initially, both students should be visible
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    expect(screen.getByText("Sally Brown")).toBeInTheDocument();

    // Enable the "no tutors" filter
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // Only student without tutors should be visible (Sally Brown)
    expect(screen.queryByText("Bob Johnson")).not.toBeInTheDocument();
    expect(screen.getByText("Sally Brown")).toBeInTheDocument();
  });

  it("shows backend-computed status correctly", () => {
    render(<StudentsTable searchTerm="" />);
    expect(screen.getByText("No tutors!")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("handles undefined data gracefully", () => {
    (useStudents as jest.Mock).mockReturnValue({
      data: { students: undefined, count: 0 },
      isLoading: false,
      error: null,
    });
    render(<StudentsTable searchTerm="" />);
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("returns null when loading", () => {
    (useStudents as jest.Mock).mockReturnValue({
      data: { students: [], count: 0 },
      isLoading: true,
      error: null,
    });
    const { container } = render(<StudentsTable searchTerm="" />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when error", () => {
    (useStudents as jest.Mock).mockReturnValue({
      data: { students: [], count: 0 },
      isLoading: false,
      error: { message: "Failed to load" },
    });
    const { container } = render(<StudentsTable searchTerm="" />);
    expect(container.firstChild).toBeNull();
  });
});
