import { render, screen, fireEvent } from "@testing-library/react";
import { AddStudentForm } from "./AddStudentForm";
import { useCreateStudent } from "@/hooks/student_management";

jest.mock("@/hooks/student_management", () => ({
  useCreateStudent: jest.fn(),
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

describe("AddStudentForm", () => {
  const mutateMock = jest.fn();
  const resetMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCreateStudent as jest.Mock).mockReturnValue({
      mutate: mutateMock.mockImplementation((_variables, options) => {
        options?.onSuccess?.();
      }),
      isPending: false,
      error: null,
      reset: resetMock,
    });
  });

  it("renders trigger button and opens dialog", () => {
    render(<AddStudentForm />);

    expect(screen.getByText("Add Student")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Add Student"));

    expect(screen.getByText("Add New Student")).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
  });

  it("submits formatted data via create mutation", () => {
    const { convertToE164 } = require("@/utils/phoneUtils");

    render(<AddStudentForm clientId={42} />);

    fireEvent.click(screen.getByText("Add Student"));

    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: "(555) 123-4567" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Add Student/i }));

    expect(convertToE164).toHaveBeenCalledWith("(555) 123-4567");
    expect(mutateMock).toHaveBeenCalledWith(
      {
        data: expect.objectContaining({
          first_name: "Jane",
          last_name: "Doe",
          email: "jane@example.com",
          phone_number: "+15551234567",
        }),
        clientId: 42,
      },
      expect.any(Object)
    );
  });

  it("shows loading state while submitting", () => {
    (useCreateStudent as jest.Mock).mockReturnValue({
      mutate: mutateMock,
      isPending: true,
      error: null,
      reset: resetMock,
    });

    render(<AddStudentForm />);

    fireEvent.click(screen.getByText("Add Student"));

    expect(screen.getByRole("button", { name: /Saving.../i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeDisabled();
  });

  it("displays error message when mutation fails", () => {
    (useCreateStudent as jest.Mock).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      error: new Error("Something went wrong"),
      reset: resetMock,
    });

    render(<AddStudentForm />);

    fireEvent.click(screen.getByText("Add Student"));

    expect(
      screen.getByText("Something went wrong")
    ).toBeInTheDocument();
  });
});
