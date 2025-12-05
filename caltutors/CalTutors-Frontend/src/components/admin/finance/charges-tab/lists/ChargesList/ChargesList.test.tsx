import { render, screen, fireEvent } from "@testing-library/react";
import { ChargesList } from "./ChargesList";
import type { Charge } from "@/types/admin_management";

const mockCharges: Charge[] = [
  {
    id: 1,
    user: 1,
    amount: "100.00",
    credits_applied: "0.00",
    final_amount: "100.00",
    currency: "usd",
    status: "pending",
    created_at: "2024-01-15T10:00:00Z",
    sessions: [1],
    user_info: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    },
    session_count: 1,
    session_details: [],
  },
  {
    id: 2,
    user: 2,
    amount: "150.00",
    credits_applied: "0.00",
    final_amount: "150.00",
    currency: "usd",
    status: "paid",
    created_at: "2024-01-16T10:00:00Z",
    sessions: [2],
    user_info: {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
    },
    session_count: 1,
    session_details: [],
  },
];

describe("ChargesList", () => {
  it("renders all charges", () => {
    const mockToggle = jest.fn();
    render(
      <ChargesList
        charges={mockCharges}
        expandedCharges={new Set()}
        onToggleCharge={mockToggle}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("calls onToggleCharge with correct charge id", () => {
    const mockToggle = jest.fn();
    render(
      <ChargesList
        charges={mockCharges}
        expandedCharges={new Set()}
        onToggleCharge={mockToggle}
      />
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);

    expect(mockToggle).toHaveBeenCalledWith(1);
  });

  it("marks items as expanded based on expandedCharges set", () => {
    const mockToggle = jest.fn();
    const expandedSet = new Set([1]);

    render(
      <ChargesList
        charges={mockCharges}
        expandedCharges={expandedSet}
        onToggleCharge={mockToggle}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders empty list when no charges", () => {
    const mockToggle = jest.fn();
    const { container } = render(
      <ChargesList
        charges={[]}
        expandedCharges={new Set()}
        onToggleCharge={mockToggle}
      />
    );

    expect(container.querySelector(".space-y-2")?.children.length).toBe(0);
  });

  it("renders correct number of items", () => {
    const mockToggle = jest.fn();
    render(
      <ChargesList
        charges={mockCharges}
        expandedCharges={new Set()}
        onToggleCharge={mockToggle}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
  });
});
