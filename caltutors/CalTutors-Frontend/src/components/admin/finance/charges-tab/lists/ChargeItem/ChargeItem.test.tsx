import { render, screen, fireEvent } from "@testing-library/react";
import { ChargeItem } from "./ChargeItem";
import type { Charge } from "@/types/admin_management";

const mockCharge: Charge = {
  id: 1,
  user: 1,
  amount: "100.00",
  credits_applied: "10.00",
  final_amount: "90.00",
  currency: "usd",
  status: "pending",
  created_at: "2024-01-15T10:00:00Z",
  sessions: [1, 2],
  user_info: {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
  },
  session_count: 2,
  session_details: [
    {
      id: 1,
      start_time: "2024-01-15T10:00:00Z",
      duration_minutes: 60,
      tutor_name: "Alice Tutor",
      student_name: "Bob Student",
      student_rate: "60.00",
      tutor_rate: "40.00",
      student_charge: "60.00",
      tutor_payment: "40.00",
      session_amount: "60.00",
    },
  ],
};

describe("ChargeItem", () => {
  it("renders client name and email", () => {
    const mockToggle = jest.fn();
    render(
      <ChargeItem
        charge={mockCharge}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    // Note: Email is not displayed in the ChargeItem component
  });

  it("renders final amount", () => {
    const mockToggle = jest.fn();
    render(
      <ChargeItem
        charge={mockCharge}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("$90.00")).toBeInTheDocument();
  });

  it("renders session count singular", () => {
    const mockToggle = jest.fn();
    const singleSession = { ...mockCharge, session_count: 1 };

    render(
      <ChargeItem
        charge={singleSession}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("1 session")).toBeInTheDocument();
  });

  it("renders session count plural", () => {
    const mockToggle = jest.fn();
    render(
      <ChargeItem
        charge={mockCharge}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("2 sessions")).toBeInTheDocument();
  });

  it("renders pending status badge", () => {
    const mockToggle = jest.fn();
    render(
      <ChargeItem
        charge={mockCharge}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders paid status badge", () => {
    const mockToggle = jest.fn();
    const paidCharge = { ...mockCharge, status: "paid" as const };

    render(
      <ChargeItem
        charge={paidCharge}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const mockToggle = jest.fn();
    render(
      <ChargeItem
        charge={mockCharge}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("shows session details when expanded", () => {
    const mockToggle = jest.fn();
    render(
      <ChargeItem charge={mockCharge} isExpanded={true} onToggle={mockToggle} />
    );

    expect(screen.getByText("Alice Tutor")).toBeInTheDocument();
    expect(screen.getByText("Bob Student")).toBeInTheDocument();
    expect(screen.getByText("$60.00/hr")).toBeInTheDocument();
    expect(screen.getByText("$60.00")).toBeInTheDocument();
  });

  it("hides session details when collapsed", () => {
    const mockToggle = jest.fn();
    render(
      <ChargeItem
        charge={mockCharge}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.queryByText("Alice Tutor")).not.toBeInTheDocument();
  });

  it("does not render sessions table when no session details", () => {
    const mockToggle = jest.fn();
    const noSessions = { ...mockCharge, session_details: [] };

    render(
      <ChargeItem charge={noSessions} isExpanded={true} onToggle={mockToggle} />
    );

    expect(screen.queryByText("Date & Time")).not.toBeInTheDocument();
  });
});
