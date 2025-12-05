import { render, screen, fireEvent } from "@testing-library/react";
import { TutorCalendar } from "./TutorCalendar";
import {
  useSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useAvailableStudents,
} from "@/hooks/session_management";
import type { Session } from "@/types/session_management";

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

jest.mock("@/components/tutor/InlineSessionEditor/InlineSessionEditor", () => ({
  __esModule: true,
  InlineSessionForm: (props: any) => (
    <div data-testid="inline-session-form">
      InlineSessionForm
      <button type="button" onClick={(e) => props.onSubmit?.(e)}>
        submit-inline
      </button>
    </div>
  ),
  InlineSessionEditor: () => <div data-testid="inline-session-editor">InlineEditor</div>,
  roundToNearest15Minutes: (date: Date) => date,
}));

jest.mock("@/components/tutor/SessionFormDialog", () => ({
  SessionFormDialog: (props: any) =>
    props.open ? <div data-testid="session-form-dialog">SessionFormDialog</div> : null,
}));

jest.mock("@/hooks/session_management");

const mockSessions: Session[] = [
  {
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
    start_time: "2025-12-05T14:00:00Z",
    end_time: "2025-12-05T15:00:00Z",
    duration_minutes: 60,
    student_charged: false,
    tutor_paid: false,
    created_at: "2025-10-20T10:00:00Z",
    updated_at: "2025-10-20T10:00:00Z",
  },
];

const mockAvailableStudents = {
  students: [
    {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      client_name: "Parent Doe",
    },
    {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      client_name: "Parent Smith",
    },
  ],
};

describe("TutorCalendar Integration Tests", () => {
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useSessions as jest.Mock).mockReturnValue({
      data: mockSessions,
      isLoading: false,
      isError: false,
      error: null,
    });

    (useAvailableStudents as jest.Mock).mockReturnValue({
      data: mockAvailableStudents,
      isError: false,
    });

    (useCreateSession as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    (useUpdateSession as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    (useDeleteSession as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });
  });

  describe("Rendering", () => {
    it("renders header with title and add button", () => {
      render(<TutorCalendar tutorId={2} />);

      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(
        screen.getByText(/Manage your tutoring sessions/)
      ).toBeInTheDocument();
      expect(screen.getByText("Add Session")).toBeInTheDocument();
    });

    it("renders calendar with sessions", () => {
      render(<TutorCalendar tutorId={2} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("shows warning when students fail to load", () => {
      (useAvailableStudents as jest.Mock).mockReturnValue({
        data: null,
        isError: true,
      });

      render(<TutorCalendar tutorId={2} />);

      expect(
        screen.getByText(/Failed to load available students/)
      ).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("shows loading state while sessions are loading", () => {
      (useSessions as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<TutorCalendar tutorId={2} />);

      expect(screen.getByText("Loading calendar data...")).toBeInTheDocument();
    });

    it("shows disabled state while mutating", () => {
      (useCreateSession as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
      });

      render(<TutorCalendar tutorId={2} />);

      const addButton = screen.getByText("Add Session");
      expect(addButton).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("shows error when sessions fail to load", () => {
      (useSessions as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: { message: "Failed to fetch sessions" },
      });

      render(<TutorCalendar tutorId={2} />);

      expect(screen.getByText("Failed to load sessions")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch sessions")).toBeInTheDocument();
    });

    it("displays retry button on error", () => {
      (useSessions as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: { message: "Failed to fetch sessions" },
      });

      render(<TutorCalendar tutorId={2} />);

      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("fetches sessions with correct tutor filter", () => {
      render(<TutorCalendar tutorId={5} />);

      expect(useSessions).toHaveBeenCalledWith({ tutor_id: 5 });
    });

    it("fetches available students on mount", () => {
      render(<TutorCalendar tutorId={2} />);

      expect(useAvailableStudents).toHaveBeenCalled();
    });

    it("displays all sessions from API", () => {
      const multipleSessions: Session[] = [
        ...mockSessions,
        {
          ...mockSessions[0],
          id: 2,
          student_info: {
            id: 2,
            first_name: "Jane",
            last_name: "Smith",
            email: "jane@example.com",
          },
        },
      ];

      (useSessions as jest.Mock).mockReturnValue({
        data: multipleSessions,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<TutorCalendar tutorId={2} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("opens the day dialog with add/view tabs when a cell is clicked", () => {
      render(<TutorCalendar tutorId={2} />);

      fireEvent.click(screen.getByText("select-slot"));

      expect(screen.getByText("Add session")).toBeInTheDocument();
      expect(screen.getByText("View events")).toBeInTheDocument();
    });

    it("shows inline editor when viewing events tab", () => {
      render(<TutorCalendar tutorId={2} />);

      fireEvent.click(screen.getByText("select-slot"));
      fireEvent.click(screen.getByText("View events"));
      fireEvent.click(screen.getByText("Edit"));

      expect(screen.getByTestId("inline-session-editor")).toBeInTheDocument();
    });

    it("initializes all mutation hooks", () => {
      render(<TutorCalendar tutorId={2} />);

      expect(useCreateSession).toHaveBeenCalled();
      expect(useUpdateSession).toHaveBeenCalled();
      expect(useDeleteSession).toHaveBeenCalled();
    });
  });

  describe("Empty State", () => {
    it("renders empty calendar when no sessions", () => {
      (useSessions as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<TutorCalendar tutorId={2} />);

      expect(screen.getByTestId("rbc-mock")).toBeInTheDocument();
    });

    it("still shows add button when no sessions", () => {
      (useSessions as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<TutorCalendar tutorId={2} />);

      expect(screen.getByText("Add Session")).toBeInTheDocument();
    });
  });
});
