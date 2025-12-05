import { render, screen, fireEvent } from "@testing-library/react";
import { TutorPaymentItem } from "./TutorPaymentItem";
import type { TutorPayment } from "@/types/admin_management";

const mockPayment: TutorPayment = {
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
      student_name: "Alice Johnson",
      start_time: "2024-01-15T10:00:00Z",
      duration_minutes: 60,
      tutor_pay_rate: "50.00",
      session_amount: "50.00",
      student_rate: "60.00",
      student_charge: "60.00",
      tutor_rate: "50.00",
      tutor_payment: "50.00",
    },
  ],
};

describe("TutorPaymentItem", () => {
  it("renders tutor name and email", () => {
    const mockToggle = jest.fn();
    render(
      <TutorPaymentItem
        payment={mockPayment}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("renders total amount", () => {
    const mockToggle = jest.fn();
    render(
      <TutorPaymentItem
        payment={mockPayment}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("$150.00")).toBeInTheDocument();
  });

  it("renders session count singular", () => {
    const mockToggle = jest.fn();
    const singleSessionPayment = { ...mockPayment, session_count: 1 };

    render(
      <TutorPaymentItem
        payment={singleSessionPayment}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("1 session")).toBeInTheDocument();
  });

  it("renders session count plural", () => {
    const mockToggle = jest.fn();
    render(
      <TutorPaymentItem
        payment={mockPayment}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("3 sessions")).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const mockToggle = jest.fn();
    render(
      <TutorPaymentItem
        payment={mockPayment}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("shows ChevronRight when collapsed", () => {
    const mockToggle = jest.fn();
    const { container } = render(
      <TutorPaymentItem
        payment={mockPayment}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    const chevronRight = container.querySelector("svg");
    expect(chevronRight).toBeInTheDocument();
  });

  it("shows sessions table when expanded", () => {
    const mockToggle = jest.fn();
    render(
      <TutorPaymentItem
        payment={mockPayment}
        isExpanded={true}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("$60.00/hr")).toBeInTheDocument();
    expect(screen.getByText("$60.00")).toBeInTheDocument();
    expect(screen.getByText("$50.00/hr")).toBeInTheDocument();
    expect(screen.getAllByText("$50.00")[0]).toBeInTheDocument();
  });

  it("hides sessions table when collapsed", () => {
    const mockToggle = jest.fn();
    render(
      <TutorPaymentItem
        payment={mockPayment}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.queryByText("Alice Johnson")).not.toBeInTheDocument();
  });
});
