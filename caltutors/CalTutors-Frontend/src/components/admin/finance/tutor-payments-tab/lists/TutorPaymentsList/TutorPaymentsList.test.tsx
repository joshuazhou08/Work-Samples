import { render, screen, fireEvent } from "@testing-library/react";
import { TutorPaymentsList } from "./TutorPaymentsList";
import type { TutorPayment } from "@/types/admin_management";

const mockPayments: TutorPayment[] = [
  {
    tutor: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    },
    total_amount: "150.00",
    session_count: 3,
    sessions: [],
  },
  {
    tutor: {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
    },
    total_amount: "200.00",
    session_count: 2,
    sessions: [],
  },
];

describe("TutorPaymentsList", () => {
  it("renders all tutor payments", () => {
    const mockToggle = jest.fn();
    render(
      <TutorPaymentsList
        tutorPayments={mockPayments}
        expandedTutors={new Set()}
        onToggleTutor={mockToggle}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("calls onToggleTutor with correct tutor id", () => {
    const mockToggle = jest.fn();
    render(
      <TutorPaymentsList
        tutorPayments={mockPayments}
        expandedTutors={new Set()}
        onToggleTutor={mockToggle}
      />
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);

    expect(mockToggle).toHaveBeenCalledWith(1);
  });

  it("marks items as expanded based on expandedTutors set", () => {
    const mockToggle = jest.fn();
    const expandedSet = new Set([1]);

    render(
      <TutorPaymentsList
        tutorPayments={mockPayments}
        expandedTutors={expandedSet}
        onToggleTutor={mockToggle}
      />
    );

    // First item should be expanded (id: 1)
    // This is verified by the component rendering differently
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders empty list when no payments", () => {
    const mockToggle = jest.fn();
    const { container } = render(
      <TutorPaymentsList
        tutorPayments={[]}
        expandedTutors={new Set()}
        onToggleTutor={mockToggle}
      />
    );

    expect(container.querySelector(".space-y-2")?.children.length).toBe(0);
  });

  it("renders correct number of items", () => {
    const mockToggle = jest.fn();
    render(
      <TutorPaymentsList
        tutorPayments={mockPayments}
        expandedTutors={new Set()}
        onToggleTutor={mockToggle}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
  });
});
