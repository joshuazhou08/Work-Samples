import { render, screen, fireEvent } from "@testing-library/react";
import { UnchargedSessionsList } from "./UnchargedSessionsList";
import type { UnchargedSessionGroup } from "@/types/admin_management";

const mockGroups: UnchargedSessionGroup[] = [
  {
    student: {
      id: 1,
      first_name: "Emma",
      last_name: "Williams",
      email: "emma@test.com",
      phone_number: "",
      grade_level: "10th Grade",
    },
    client: {
      id: 2,
      first_name: "Mary",
      last_name: "Williams",
      email: "mary@test.com",
      phone_number: "+15551112222",
    },
    sessions: [
      {
        id: 1,
        tutor_name: "Alice Tutor",
        start_time: "2024-01-15T10:00:00Z",
        duration_minutes: 60,
      },
    ],
  },
  {
    student: {
      id: 2,
      first_name: "Oliver",
      last_name: "Davis",
      email: "oliver@test.com",
      phone_number: "",
      grade_level: "9th Grade",
    },
    client: {
      id: 3,
      first_name: "John",
      last_name: "Davis",
      email: "john@test.com",
      phone_number: "+15553334444",
    },
    sessions: [
      {
        id: 2,
        tutor_name: "Bob Tutor",
        start_time: "2024-01-16T10:00:00Z",
        duration_minutes: 90,
      },
    ],
  },
];

describe("UnchargedSessionsList", () => {
  it("renders all student groups", () => {
    const mockToggle = jest.fn();
    render(
      <UnchargedSessionsList
        groups={mockGroups}
        expandedStudents={new Set()}
        onToggleStudent={mockToggle}
      />
    );

    expect(screen.getByText("Emma Williams")).toBeInTheDocument();
    expect(screen.getByText("Oliver Davis")).toBeInTheDocument();
  });

  it("calls onToggleStudent with correct student id", () => {
    const mockToggle = jest.fn();
    render(
      <UnchargedSessionsList
        groups={mockGroups}
        expandedStudents={new Set()}
        onToggleStudent={mockToggle}
      />
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);

    expect(mockToggle).toHaveBeenCalledWith(1);
  });

  it("marks items as expanded based on expandedStudents set", () => {
    const mockToggle = jest.fn();
    const expandedSet = new Set([1]);

    render(
      <UnchargedSessionsList
        groups={mockGroups}
        expandedStudents={expandedSet}
        onToggleStudent={mockToggle}
      />
    );

    expect(screen.getByText("Emma Williams")).toBeInTheDocument();
  });

  it("renders empty list when no groups", () => {
    const mockToggle = jest.fn();
    const { container } = render(
      <UnchargedSessionsList
        groups={[]}
        expandedStudents={new Set()}
        onToggleStudent={mockToggle}
      />
    );

    expect(container.querySelector(".space-y-2")?.children.length).toBe(0);
  });

  it("renders correct number of items", () => {
    const mockToggle = jest.fn();
    render(
      <UnchargedSessionsList
        groups={mockGroups}
        expandedStudents={new Set()}
        onToggleStudent={mockToggle}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
  });
});
