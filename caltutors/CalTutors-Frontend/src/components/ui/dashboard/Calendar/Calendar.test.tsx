import { render, screen, fireEvent } from "@testing-library/react";
import { Calendar } from "./Calendar";
import type { Session } from "@/types/session_management";

jest.mock("react-big-calendar", () => {
  const React = require("react");
  const Views = { MONTH: "month", WEEK: "week", DAY: "day" };
  const Calendar = (props: any) => (
    <div data-testid="rbc-mock" className="rbc-calendar">
      <div>
        {props.events?.map((event: any) => (
          <button
            key={event.id}
            type="button"
            onClick={() => props.onSelectEvent?.(event)}
          >
            {event.title}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          props.onSelectSlot?.({
            start: new Date("2025-12-05T12:00:00Z"),
            end: new Date("2025-12-05T13:00:00Z"),
          })
        }
      >
        select-slot
      </button>
      <button
        type="button"
        onClick={() => props.onDrillDown?.(new Date("2025-12-05T12:00:00Z"))}
      >
        drilldown
      </button>
      <button
        type="button"
        onClick={() => props.onShowMore?.([], new Date("2025-12-05T12:00:00Z"))}
      >
        show-more
      </button>
    </div>
  );
  const dateFnsLocalizer = () => ({});
  return { __esModule: true, Calendar, dateFnsLocalizer, Views };
});

const start = new Date("2025-12-05T14:00:00Z");
const end = new Date("2025-12-05T15:00:00Z");

const mockSession: Session = {
  id: 1,
  student: 1,
  tutor: 2,
  student_info: {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
  },
  tutor_info: {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email: "jane@example.com",
  },
  start_time: start.toISOString(),
  end_time: end.toISOString(),
  duration_minutes: 60,
  student_charged: false,
  tutor_paid: false,
  created_at: start.toISOString(),
  updated_at: start.toISOString(),
};

describe("Calendar", () => {
  it("renders loading state", () => {
    render(<Calendar sessions={[]} isLoading={true} />);
    expect(screen.getByText("Loading calendar data...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <Calendar
        sessions={[]}
        isError={true}
        error={{ message: "Test error" }}
      />
    );
    expect(screen.getByText("Failed to load sessions")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("renders error with default message when no error message provided", () => {
    render(<Calendar sessions={[]} isError={true} />);
    expect(
      screen.getByText("An unexpected error occurred")
    ).toBeInTheDocument();
  });

  it("renders calendar with sessions", () => {
    render(<Calendar sessions={[mockSession]} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("opens day dialog when a cell is clicked", () => {
    render(<Calendar sessions={[mockSession]} />);

    fireEvent.click(screen.getByText("select-slot"));

    expect(
      screen.getByText("Browse every event scheduled for this day.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
  });

  it("shows add/view tabs for selectable calendars", () => {
    render(<Calendar sessions={[mockSession]} selectable />);

    fireEvent.click(screen.getByText("select-slot"));

    expect(screen.getByText("Add session")).toBeInTheDocument();
    expect(screen.getByText("View events")).toBeInTheDocument();
  });

  it("renders empty calendar when no sessions", () => {
    const { container } = render(<Calendar sessions={[]} />);
    const calendar = container.querySelector(".rbc-calendar");
    expect(calendar).toBeInTheDocument();
  });

  it("passes selectable prop to calendar", () => {
    const { container } = render(<Calendar sessions={[]} selectable={true} />);
    const calendar = container.querySelector(".rbc-calendar");
    expect(calendar).toBeInTheDocument();
  });
});
