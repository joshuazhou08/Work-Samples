"use client";

import { useState, useCallback } from "react";
import { Calendar, CalendarSession } from "@/components/ui/dashboard";
import { SessionDetailsDialog } from "@/components/client/calendar/SessionDetailsDialog";
import { useSessions } from "@/hooks/session_management";
import type { Session } from "@/types/session_management";

interface ClientCalendarProps {
  clientId: number;
}

export function ClientCalendar({ clientId }: ClientCalendarProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
  } = useSessions({ client_id: clientId });

  const handleSelectEvent = useCallback((event: CalendarSession) => {
    if (event.resource) {
      setSelectedSession(event.resource);
      setShowDetails(true);
    }
  }, []);

  const eventStyleGetter = useCallback(
    (
      event: CalendarSession,
      _start: Date,
      _end: Date,
      _isSelected: boolean
    ) => {
      const session = event.resource;
      const isAwaitingPayment = session ? !session.student_charged : false;

      if (isAwaitingPayment) {
        return {
          className: "ct-calendar-event ct-calendar-event--unpaid",
          style: {
            backgroundColor: "#3b82f6",
            borderRadius: "4px",
            opacity: 0.9,
            color: "#ffffff",
            border: "0px",
            display: "block",
            fontSize: "0.75rem",
            fontWeight: "500",
            padding: "2px 4px",
          },
        };
      }

      return {
        className: "ct-calendar-event ct-calendar-event--paid",
        style: {
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          color: "#1f2937",
          fontSize: "0.75rem",
          fontWeight: "500",
          padding: "2px 4px",
        },
      };
    },
    []
  );

  const handleCellClick = useCallback((_date: Date) => {
    // handled by shared Calendar to open day dialog; no-op needed for tests/customization
  }, []);

  return (
    <>
      <div className="mb-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
        <p className="text-base text-gray-600">
          View your scheduled tutoring sessions
        </p>
      </div>

      <div className="flex items-center gap-6 px-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-block h-3 w-3 rounded bg-blue-500" />
          <span>Awaiting payment</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-block h-3 w-3 rounded border border-gray-300 bg-white" />
          <span>Paid session</span>
        </div>
      </div>

      <Calendar
        sessions={sessions}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onSelectEvent={handleSelectEvent}
        selectable={true}
        onCellClick={handleCellClick}
        eventPropGetter={eventStyleGetter}
      />

      <SessionDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        session={selectedSession}
      />
    </>
  );
}
