import { render, screen } from "@testing-library/react";
import SessionsTab from "./SessionsTab";
import type { SessionStats } from "@/types/admin_management";
import type { ComponentProps } from "react";

const DEFAULT_START_DATE = "2024-01-01";
const DEFAULT_END_DATE = "2024-01-31";

const createMockStats = (): SessionStats => ({
  total_sessions: 25,
  completed_sessions: 18,
  upcoming_sessions: 4,
  in_progress_sessions: 3,
  total_hours: "42.5",
  top_tutors: [
    {
      tutor: {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      },
      session_count: 12,
    },
    {
      tutor: {
        id: 2,
        first_name: "Jane",
        last_name: "Smith",
        email: "jane@example.com",
      },
      session_count: 8,
    },
  ],
  bottom_tutors: [
    {
      tutor: {
        id: 3,
        first_name: "Tim",
        last_name: "Lee",
        email: "tim@example.com",
      },
      session_count: 2,
    },
  ],
  start_date: DEFAULT_START_DATE,
  end_date: DEFAULT_END_DATE,
});

describe("SessionsTab", () => {
  const renderComponent = (props?: Partial<ComponentProps<typeof SessionsTab>>) =>
    render(<SessionsTab {...props} />);

  it("renders stats and tutor tables when data provided", () => {
    const mockStats = createMockStats();
    renderComponent({ sessionStats: mockStats });

    expect(screen.getByText("Total Sessions")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Total Hours")).toBeInTheDocument();
    expect(screen.getByText("42.5")).toBeInTheDocument();

    expect(screen.getByText("Most Active Tutors")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    expect(screen.getByText("Least Active Tutors")).toBeInTheDocument();
    expect(screen.getByText("Tim Lee")).toBeInTheDocument();
  });

  it("shows loading skeletons while stats are loading", () => {
    const { container } = renderComponent({ isLoading: true });

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
    expect(screen.getByText("Most Active Tutors")).toBeInTheDocument();
    expect(screen.getByText("Least Active Tutors")).toBeInTheDocument();
    expect(screen.queryByText("Total Sessions")).not.toBeInTheDocument();
  });

  it("prioritizes loading state even when session data exists", () => {
    const { container } = renderComponent({
      isLoading: true,
      sessionStats: createMockStats(),
    });

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
    expect(screen.queryByText("Total Sessions")).not.toBeInTheDocument();
  });

  it("renders error state when stats fetching fails", () => {
    const error = new Error("Network error");
    renderComponent({ error });

    expect(
      screen.getByText("Error loading session stats")
    ).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("shows empty tutor tables when no stats are available", () => {
    const emptyStats: SessionStats = {
      ...createMockStats(),
      total_sessions: 0,
      completed_sessions: 0,
      upcoming_sessions: 0,
      in_progress_sessions: 0,
      total_hours: "0",
      top_tutors: [],
      bottom_tutors: [],
    };

    renderComponent({ sessionStats: emptyStats });

    const emptyMessages = screen.getAllByText(
      "No tutor data available for this period"
    );
    expect(emptyMessages).toHaveLength(2);
  });
});
