import { render, screen, fireEvent } from "@testing-library/react";
import { SessionDetailsDialog } from "./SessionDetailsDialog";
import { createSession } from "@/utils/test-utils";

describe("SessionDetailsDialog", () => {
  it("returns null when no session is provided", () => {
    const { container } = render(
      <SessionDetailsDialog
        open={false}
        onOpenChange={jest.fn()}
        session={null}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders the primary session details and payment status", () => {
    const session = createSession({
      start_time: "2025-02-01T15:30:00Z",
      end_time: "2025-02-01T16:30:00Z",
      duration_minutes: 60,
      student_charged: true,
      tutor_paid: false,
    });

    render(
      <SessionDetailsDialog
        open={true}
        onOpenChange={jest.fn()}
        session={session}
      />
    );

    const formattedDate = new Date(session.start_time).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    const formattedStart = new Date(session.start_time).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );
    const formattedEnd = new Date(session.end_time).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );

    expect(screen.getByText("Session Details")).toBeInTheDocument();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
    expect(
      screen.getByText(`${formattedStart} - ${formattedEnd}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${session.duration_minutes} minutes`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${session.tutor_info.first_name} ${session.tutor_info.last_name}`
      )
    ).toBeInTheDocument();
    expect(screen.getByText(session.tutor_info.email)).toBeInTheDocument();
    expect(
      screen.getByText(
        `${session.student_info.first_name} ${session.student_info.last_name}`
      )
    ).toBeInTheDocument();
    expect(screen.getByText(`$${session.student_rate}/hour`)).toBeInTheDocument();
    expect(
      screen.getByText(/This session has been charged to the student/i)
    ).toBeInTheDocument();
  });

  it("shows fully paid message when tutor has been paid", () => {
    const session = createSession({
      student_charged: true,
      tutor_paid: true,
    });

    render(
      <SessionDetailsDialog
        open={true}
        onOpenChange={jest.fn()}
        session={session}
      />
    );

    expect(
      screen.getByText(/This session has been fully paid/i)
    ).toBeInTheDocument();
  });

  it("calls onOpenChange when the close button is pressed", () => {
    const session = createSession({
      student_charged: true,
    });
    const handleOpenChange = jest.fn();

    render(
      <SessionDetailsDialog
        open={true}
        onOpenChange={handleOpenChange}
        session={session}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
