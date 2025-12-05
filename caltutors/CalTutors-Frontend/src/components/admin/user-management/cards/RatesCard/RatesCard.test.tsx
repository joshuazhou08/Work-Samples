import { render, screen } from "@testing-library/react";
import { RatesCard } from "./RatesCard";

jest.mock("@/hooks/admin_management", () => ({
  useAdminTutors: jest.fn(() => ({ data: [] })),
  useStudentRates: jest.fn(() => ({ data: [], isLoading: false })),
  useTutorRates: jest.fn(() => ({ data: [], isLoading: false })),
  useCreateRate: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useUpdateRate: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useDeleteRate: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
}));

jest.mock("@/hooks/student_management", () => ({
  useStudents: jest.fn(() => ({ data: { students: [] } })),
}));

describe("RatesCard", () => {
  it("renders student rates heading for tutors", () => {
    render(<RatesCard userType="tutor" userId={1} />);
    expect(screen.getByText("Student Rates")).toBeInTheDocument();
  });

  it("renders tutoring rates heading for students", () => {
    render(<RatesCard userType="student" userId={1} />);
    expect(screen.getByText("Tutoring Rates")).toBeInTheDocument();
  });

  it("renders assign tutor button for students", () => {
    render(<RatesCard userType="student" userId={1} />);
    expect(screen.getByText("Assign Tutor")).toBeInTheDocument();
  });

  it("renders assign student button for tutors", () => {
    render(<RatesCard userType="tutor" userId={1} />);
    expect(screen.getByText("Assign Student")).toBeInTheDocument();
  });

  it("shows empty state when no rates exist for tutors", () => {
    render(<RatesCard userType="tutor" userId={1} />);
    expect(screen.getByText("No students assigned")).toBeInTheDocument();
  });

  it("shows empty state when no rates exist for students", () => {
    render(<RatesCard userType="student" userId={1} />);
    expect(screen.getByText("No tutors assigned")).toBeInTheDocument();
  });
});
