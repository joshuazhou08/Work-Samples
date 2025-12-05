import { render, screen, fireEvent } from "@testing-library/react";
import { StudentsCard } from "./StudentsCard";
import {
  useAdminTutors,
  useCreateRate,
  useUpdateRate,
  useDeleteRate,
  useStudentRates,
} from "@/hooks/admin_management";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/student_management";

jest.mock("@/hooks/admin_management", () => ({
  useAdminTutors: jest.fn(),
  useStudentRates: jest.fn(),
  useCreateRate: jest.fn(),
  useUpdateRate: jest.fn(),
  useDeleteRate: jest.fn(),
}));

jest.mock("@/hooks/student_management", () => ({
  useStudents: jest.fn(),
  useCreateStudent: jest.fn(),
  useUpdateStudent: jest.fn(),
  useDeleteStudent: jest.fn(),
}));

const mockMutateAsync = jest.fn();

const mockStudents = [
  {
    id: 1,
    client: 2,
    first_name: "John",
    last_name: "Doe",
    email: "john@test.com",
    phone_number: "+1234567890",
    grade_level: "10th Grade",
    subjects_studying: "Math, Science",
    notes: "Good student",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: 2,
    client: 3,
    first_name: "Jane",
    last_name: "Smith",
    email: "jane@test.com",
    grade_level: "9th Grade",
    subjects_studying: "English",
    is_active: true,
    created_at: "2024-01-02",
    updated_at: "2024-01-02",
  },
];

describe("StudentsCard", () => {
  const mockMutate = jest.fn();
  const mockReset = jest.fn();

  beforeEach(() => {
    mockMutate.mockReset();
    mockReset.mockReset();
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue(undefined);
    mockMutate.mockImplementation((_variables, options) => {
      options?.onSuccess?.();
    });
    (useStudents as jest.Mock).mockReturnValue({
      data: { students: mockStudents, count: mockStudents.length },
      isLoading: false,
    });
    (useCreateStudent as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
      reset: mockReset,
    });
    (useUpdateStudent as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
      reset: mockReset,
    });
    (useDeleteStudent as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      reset: mockReset,
    });
    (useAdminTutors as jest.Mock).mockReturnValue({
      data: [],
    });
    (useStudentRates as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (useCreateRate as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    (useUpdateRate as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    (useDeleteRate as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders students heading with count", () => {
    render(<StudentsCard clientId={2} />);
    expect(screen.getByText("Students (1)")).toBeInTheDocument();
  });

  it("renders add student button", () => {
    render(<StudentsCard clientId={2} />);
    expect(screen.getByText("Add Student")).toBeInTheDocument();
  });

  it("displays only students for the specific client", () => {
    render(<StudentsCard clientId={2} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("displays student information correctly", () => {
    render(<StudentsCard clientId={2} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("10th Grade")).toBeInTheDocument();
    expect(screen.getByText("john@test.com")).toBeInTheDocument();
    expect(screen.getByText("Math, Science")).toBeInTheDocument();
    expect(screen.getByText("Good student")).toBeInTheDocument();
  });

  it("renders empty state when no students", () => {
    render(<StudentsCard clientId={999} />);
    expect(screen.getByText("No students yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add a student to get started")
    ).toBeInTheDocument();
  });

  it("renders loading state", () => {
    (useStudents as jest.Mock).mockReturnValue({
      data: { students: [], count: 0 },
      isLoading: true,
    });
    render(<StudentsCard clientId={2} />);
    expect(screen.getByText("Loading students...")).toBeInTheDocument();
  });

  it("opens edit form when edit button is clicked", () => {
    render(<StudentsCard clientId={2} />);
    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);
    expect(screen.getByText("Edit Student - John Doe")).toBeInTheDocument();
  });

  it("renders edit button for each student", () => {
    render(<StudentsCard clientId={2} />);
    const editButtons = screen.getAllByText("Edit");
    expect(editButtons).toHaveLength(1); // Only one student for client 2
  });

  it("displays rate management section for each student", () => {
    render(<StudentsCard clientId={2} />);
    expect(screen.getByText("Tutoring Rates")).toBeInTheDocument();
  });

  it("shows 'No tutors assigned!' status when student has no rates", () => {
    render(<StudentsCard clientId={2} />);
    expect(screen.getByText("No tutors assigned!")).toBeInTheDocument();
  });

  it("displays tutor rates when student has assigned tutors", () => {
    (useStudentRates as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          student: 1,
          tutor: 1,
          student_rate: "60.00",
          tutor_pay_rate: "40.00",
          tutor_info: {
            first_name: "John",
            last_name: "Tutor",
          },
        },
      ],
      isLoading: false,
    });

    render(<StudentsCard clientId={2} />);
    expect(screen.getByText("John Tutor")).toBeInTheDocument();
    expect(screen.getByText("Student: $60.00/hr")).toBeInTheDocument();
    expect(screen.getByText("Tutor: $40.00/hr")).toBeInTheDocument();
  });
});
