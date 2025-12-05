import { render, screen, fireEvent } from "@testing-library/react";
import { UnchargedSessionItem } from "./UnchargedSessionItem";
import type { UnchargedSessionGroup } from "@/types/admin_management";

const mockGroup: UnchargedSessionGroup = {
  student: {
    id: 1,
    first_name: "Emma",
    last_name: "Williams",
    email: "emma@test.com",
    phone_number: "+15551234567",
    grade_level: "10th Grade",
  },
  client: {
    id: 2,
    first_name: "Mary",
    last_name: "Williams",
    email: "mary@test.com",
    phone_number: "+15554445555",
  },
  sessions: [
    {
      id: 1,
      tutor_name: "Alice Tutor",
      start_time: "2024-01-15T10:00:00Z",
      duration_minutes: 60,
    },
    {
      id: 2,
      tutor_name: "Bob Tutor",
      start_time: "2024-01-16T14:30:00Z",
      duration_minutes: 90,
    },
  ],
};

describe("UnchargedSessionItem", () => {
  it("renders student name", () => {
    const mockToggle = jest.fn();
    render(
      <UnchargedSessionItem
        group={mockGroup}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("Emma Williams")).toBeInTheDocument();
  });

  it("renders session summary info", () => {
    const mockToggle = jest.fn();
    render(
      <UnchargedSessionItem
        group={mockGroup}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(
      screen.getByText("2 sessions with multiple tutors")
    ).toBeInTheDocument();
  });

  it("renders session count singular", () => {
    const mockToggle = jest.fn();
    const singleSession = {
      ...mockGroup,
      sessions: [mockGroup.sessions[0]],
    };

    render(
      <UnchargedSessionItem
        group={singleSession}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("1 session")).toBeInTheDocument();
  });

  it("renders session count plural", () => {
    const mockToggle = jest.fn();
    render(
      <UnchargedSessionItem
        group={mockGroup}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("2 sessions")).toBeInTheDocument();
  });

  it("renders student email", () => {
    const mockToggle = jest.fn();
    render(
      <UnchargedSessionItem
        group={mockGroup}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("emma@test.com")).toBeInTheDocument();
  });

  it("shows 'No email' when email is missing", () => {
    const mockToggle = jest.fn();
    const noEmail = {
      ...mockGroup,
      student: { ...mockGroup.student, email: "" },
    };

    render(
      <UnchargedSessionItem
        group={noEmail}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("No email")).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const mockToggle = jest.fn();
    render(
      <UnchargedSessionItem
        group={mockGroup}
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
      <UnchargedSessionItem
        group={mockGroup}
        isExpanded={true}
        onToggle={mockToggle}
      />
    );

    expect(screen.getByText("Alice Tutor")).toBeInTheDocument();
    expect(screen.getByText("Bob Tutor")).toBeInTheDocument();
  });

  it("hides session details when collapsed", () => {
    const mockToggle = jest.fn();
    render(
      <UnchargedSessionItem
        group={mockGroup}
        isExpanded={false}
        onToggle={mockToggle}
      />
    );

    expect(screen.queryByText("Alice Tutor")).not.toBeInTheDocument();
  });

  it("does not render table when no sessions", () => {
    const mockToggle = jest.fn();
    const noSessions = { ...mockGroup, sessions: [] };

    render(
      <UnchargedSessionItem
        group={noSessions}
        isExpanded={true}
        onToggle={mockToggle}
      />
    );

    expect(screen.queryByText("Date & Time")).not.toBeInTheDocument();
  });
});
