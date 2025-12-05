import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ClientCalendar } from "./ClientCalendar";
import { useSessions } from "@/hooks/session_management";
import { createSession } from "@/utils/test-utils";

jest.mock("react-big-calendar", () => {
  const React = require("react");
  const Views = { MONTH: "month", WEEK: "week", DAY: "day" };
  const Calendar = (props: any) => (
    <div data-testid="rbc-mock">
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
    </div>
  );
  const dateFnsLocalizer = () => ({});
  return { __esModule: true, Calendar, dateFnsLocalizer, Views };
});

jest.mock("@/hooks/session_management");

const mockUseSessions = useSessions as jest.Mock;
const sessionDetailsMock = jest.fn();

jest.mock("../SessionDetailsDialog", () => ({
  SessionDetailsDialog: (props: any) => {
    sessionDetailsMock(props);
    if (!props.session) {
      return null;
    }

    return (
      <div
        data-testid="session-details-mock"
        data-open={props.open}
        data-session-id={props.session.id}
      />
    );
  },
}));

describe("ClientCalendar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionDetailsMock.mockClear();
  });

  it("renders headings, legend, and passes sessions to the calendar component", () => {
    const session = createSession({ id: 1, student_charged: false });
    mockUseSessions.mockReturnValue({
      data: [session],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ClientCalendar clientId={123} />);

    expect(mockUseSessions).toHaveBeenCalledWith({ client_id: 123 });
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(
      screen.getByText("View your scheduled tutoring sessions")
    ).toBeInTheDocument();
    expect(screen.getByText("Awaiting payment")).toBeInTheDocument();
    expect(screen.getByText("Paid session")).toBeInTheDocument();
  });

  it("opens day events when a cell is clicked", () => {
    const session = createSession({
      id: 42,
      start_time: "2025-12-05T12:00:00Z",
      end_time: "2025-12-05T13:00:00Z",
      student_info: { first_name: "John", last_name: "Doe" },
    });
    mockUseSessions.mockReturnValue({
      data: [session],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ClientCalendar clientId={123} />);

    fireEvent.click(screen.getByText("select-slot"));

    expect(
      screen.getByText("Browse every event scheduled for this day.")
    ).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("opens the session details dialog when an event is selected", async () => {
    const session = createSession({
      id: 42,
      start_time: "2025-12-05T12:00:00Z",
      end_time: "2025-12-05T13:00:00Z",
      student_info: { first_name: "John", last_name: "Doe" },
      student_charged: false,
    });

    mockUseSessions.mockReturnValue({
      data: [session],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ClientCalendar clientId={500} />);

    fireEvent.click(screen.getByText("John Doe"));

    await waitFor(() => {
      const lastCall =
        sessionDetailsMock.mock.calls[sessionDetailsMock.mock.calls.length - 1][0];
      expect(lastCall).toMatchObject({
        open: true,
        session,
      });
    });
  });
});
