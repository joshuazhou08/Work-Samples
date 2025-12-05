import { render, screen, fireEvent } from "@testing-library/react";
import { EditStudentForm } from "./EditStudentForm";
import { useUpdateStudent, useDeleteStudent } from "@/hooks/student_management";
import type { Student } from "@/types/students";

jest.mock("@/hooks/student_management", () => ({
  useUpdateStudent: jest.fn(),
  useDeleteStudent: jest.fn(),
}));

jest.mock("@/utils/phoneUtils", () => ({
  convertToE164: jest.fn((value: string) =>
    value ? `+1${value.replace(/\D/g, "")}` : value
  ),
}));

jest.mock("@/components/ui/general", () => {
  const actual = jest.requireActual("@/components/ui/general");
  return {
    ...actual,
    PhoneNumberInput: ({
      value,
      onChange,
      onValidityChange,
      ...props
    }: {
      value: string;
      onChange: (value: string, meta?: { isValid: boolean }) => void;
      onValidityChange?: (isValid: boolean) => void;
    }) => (
      <input
        aria-label="Phone Number"
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue, { isValid: true });
          onValidityChange?.(true);
        }}
        {...props}
      />
    ),
  };
});

describe("EditStudentForm", () => {
  const mockStudent: Student = {
    id: 1,
    client: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone_number: "+15551234567",
    grade_level: "10",
    subjects_studying: "Math",
    notes: "Great student",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mutateUpdateMock = jest.fn();
  const mutateDeleteMock = jest.fn();
  const resetUpdateMock = jest.fn();
  const resetDeleteMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUpdateStudent as jest.Mock).mockReturnValue({
      mutate: mutateUpdateMock.mockImplementation((_variables, options) => {
        options?.onSuccess?.();
      }),
      isPending: false,
      error: null,
      reset: resetUpdateMock,
    });
    (useDeleteStudent as jest.Mock).mockReturnValue({
      mutate: mutateDeleteMock.mockImplementation((_variables, options) => {
        options?.onSuccess?.();
      }),
      isPending: false,
      reset: resetDeleteMock,
    });
  });

  it("renders student data in dialog", () => {
    render(
      <EditStudentForm isOpen={true} student={mockStudent} onClose={jest.fn()} />
    );

    expect(
      screen.getByText(/Edit Student - John Doe/i)
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("John")).toBeInTheDocument();
    expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
  });

  it("calls update mutation with formatted data", () => {
    const onClose = jest.fn();

    render(<EditStudentForm isOpen={true} student={mockStudent} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "Jane" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    expect(mutateUpdateMock).toHaveBeenCalledTimes(1);

    const [variables, callbacks] = mutateUpdateMock.mock.calls[0];

    expect(variables).toEqual({
      studentId: 1,
      data: {
        first_name: "Jane",
        last_name: "Doe",
        email: "john@example.com",
        phone_number: "+115551234567",
        grade_level: "10",
        subjects_studying: "Math",
        notes: "Great student",
      },
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("opens delete confirmation and triggers delete mutation", () => {
    const onClose = jest.fn();

    render(<EditStudentForm isOpen={true} student={mockStudent} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /Delete Student/i }));
    expect(
      screen.getByText(/Are you sure you want to delete John Doe/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));

    expect(mutateDeleteMock).toHaveBeenCalledWith(
      { studentId: 1 },
      expect.any(Object)
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("displays error message when update fails", () => {
    (useUpdateStudent as jest.Mock).mockReturnValue({
      mutate: mutateUpdateMock,
      isPending: false,
      error: new Error("Update failed"),
      reset: resetUpdateMock,
    });
    (useDeleteStudent as jest.Mock).mockReturnValue({
      mutate: mutateDeleteMock,
      isPending: false,
      reset: resetDeleteMock,
    });

    render(
      <EditStudentForm isOpen={true} student={mockStudent} onClose={jest.fn()} />
    );

    expect(screen.getByText("Update failed")).toBeInTheDocument();
  });

  it("disables actions while mutation is pending", () => {
    (useUpdateStudent as jest.Mock).mockReturnValue({
      mutate: mutateUpdateMock,
      isPending: true,
      error: null,
      reset: resetUpdateMock,
    });
    (useDeleteStudent as jest.Mock).mockReturnValue({
      mutate: mutateDeleteMock,
      isPending: true,
      reset: resetDeleteMock,
    });

    render(
      <EditStudentForm isOpen={true} student={mockStudent} onClose={jest.fn()} />
    );

    expect(
      screen.getByRole("button", { name: /Saving.../i })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeDisabled();
    const deleteButton = screen.getByRole("button", {
      name: /Deleting\.\.\./i,
    });
    expect(deleteButton).toBeDisabled();
  });
});
