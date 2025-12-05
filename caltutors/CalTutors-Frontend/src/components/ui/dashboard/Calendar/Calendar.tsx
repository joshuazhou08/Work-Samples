"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
  View,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  isSameDay,
  startOfDay,
  endOfDay,
} from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import type { CalendarProps, CalendarSession } from "./types";
import { apiSessionToCalendarSession } from "./utils";
import {
  locales,
  eventStyleGetter,
  dayPropGetter,
  calendarFormats,
} from "./config";
import { CalendarToolbar } from "./CalendarToolbar";
import { DayEventsDialog } from "./DayEventsDialog";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MOBILE_BREAKPOINT = 768;

const detectIsMobile = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
};

export function Calendar({
  sessions: apiSessions,
  isLoading,
  isError,
  error,
  onSelectSlot,
  onSelectEvent,
  onInlineEditSelect,
  onCellClick,
  selectable = false,
  eventPropGetter,
  renderAddContent,
  renderInlineEventEditor,
}: CalendarProps) {
  const initialIsMobile = detectIsMobile();
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [view, setView] = useState<View>(
    initialIsMobile ? Views.DAY : Views.MONTH
  );
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "add">(
    selectable ? "add" : "events"
  );

  useEffect(() => {
    const detectScreen = () => {
      setIsMobile(detectIsMobile());
    };

    detectScreen();
    window.addEventListener("resize", detectScreen);
    return () => window.removeEventListener("resize", detectScreen);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setView((prev) =>
        prev === Views.DAY || prev === Views.WEEK ? prev : Views.DAY
      );
    }
  }, [isMobile]);

  const availableViews = useMemo<View[]>(() => {
    return isMobile
      ? [Views.DAY, Views.WEEK]
      : [Views.MONTH, Views.WEEK, Views.DAY];
  }, [isMobile]);

  useEffect(() => {
    setView((prev) =>
      availableViews.includes(prev) ? prev : availableViews[0]
    );
  }, [availableViews]);

  useEffect(() => {
    if (!selectable && activeTab === "add") {
      setActiveTab("events");
    }
  }, [selectable, activeTab]);

  useEffect(() => {
    const handleSwitchToEvents = () => setActiveTab("events");
    window.addEventListener(
      "ct-calendar-switch-to-events",
      handleSwitchToEvents
    );
    return () => {
      window.removeEventListener(
        "ct-calendar-switch-to-events",
        handleSwitchToEvents
      );
    };
  }, []);

  const sessions = useMemo(() => {
    if (!Array.isArray(apiSessions)) {
      return [];
    }

    return apiSessions.reduce<CalendarSession[]>((acc, session) => {
      if (!session) {
        return acc;
      }

      try {
        const event = apiSessionToCalendarSession(session);
        if (event?.title) {
          acc.push(event);
        }
      } catch (error) {
        console.error(
          "Failed to convert session to calendar event",
          error,
          session
        );
      }

      return acc;
    }, []);
  }, [apiSessions]);

  const handleNavigate = useCallback((nextDate: Date) => {
    setDate(nextDate);
  }, []);

  const handleSelectEvent = useCallback(
    (event: CalendarSession) => {
      if (onSelectEvent) {
        onSelectEvent(event);
      }
    },
    [onSelectEvent]
  );

  const effectiveView = useMemo(() => {
    return availableViews.includes(view) ? view : availableViews[0];
  }, [availableViews, view]);

  const handleOpenDayDetails = useCallback(
    (
      slot: {
        start: Date;
        end: Date;
      },
      tab?: "events" | "add"
    ) => {
      setSelectedSlot(slot);
      setActiveTab(tab ?? (selectable ? "add" : "events"));
      setDayDialogOpen(true);
    },
    [selectable]
  );

  const handleAddSessionClick = useCallback(() => {
    if (onSelectSlot && selectedSlot) {
      onSelectSlot(selectedSlot);
    }
    setDayDialogOpen(false);
  }, [onSelectSlot, selectedSlot]);

  const selectedDate = selectedSlot?.start ?? null;

  const dayEvents = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    return sessions
      .filter((event) => isSameDay(event.start, selectedDate))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [selectedDate, sessions]);

  const MonthDateHeader = useCallback(
    ({ label }: { label: string; date: Date }) => (
      <span className="w-full text-left font-medium text-gray-700">
        {label}
      </span>
    ),
    []
  );

  const ShowMoreButton = useCallback(
    ({
      slotDate,
      count,
    }: {
      slotDate: Date;
      count: number;
      events: CalendarSession[];
      remainingEvents: CalendarSession[];
      slot: number;
      localizer: any;
    }) => (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="rbc-show-more h-7 px-2 text-xs"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleOpenDayDetails(
            { start: startOfDay(slotDate), end: endOfDay(slotDate) },
            selectable ? "add" : "events"
          );
        }}
      >
        View all ({count})
      </Button>
    ),
    [handleOpenDayDetails, selectable]
  );

  const handleCellClick = useCallback(
    (value: Date) => {
      if (onCellClick) {
        onCellClick(value);
      }
      handleOpenDayDetails(
        { start: startOfDay(value), end: endOfDay(value) },
        selectable ? "add" : "events"
      );
    },
    [handleOpenDayDetails, onCellClick, selectable]
  );

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      setSelectedSlot(slotInfo);
      if (onSelectSlot) {
        onSelectSlot(slotInfo);
      }
      handleCellClick(slotInfo.start);
    },
    [handleCellClick, onSelectSlot]
  );

  const handleDayDialogChange = (open: boolean) => {
    setDayDialogOpen(open);
    if (!open) {
      setActiveTab(selectable ? "add" : "events");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-lg">Loading calendar data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          Failed to load sessions
        </h3>
        <p className="mb-8 mt-2 text-base">
          {error?.message || "An unexpected error occurred"}
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mx-3"
      style={{ height: "80%" }}
    >
      <BigCalendar
        key={`calendar-${effectiveView}`}
        localizer={localizer}
        events={sessions}
        startAccessor="start"
        endAccessor="end"
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable={selectable}
        popup={false}
        views={availableViews}
        view={effectiveView}
        onView={setView}
        date={date}
        onNavigate={handleNavigate}
        eventPropGetter={eventPropGetter ?? eventStyleGetter}
        dayPropGetter={dayPropGetter}
        formats={calendarFormats}
        step={30}
        timeslots={2}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 22, 0, 0)}
        style={{ height: "100%" }}
        components={{
          toolbar: (props: any) => (
            <CalendarToolbar
              label={props.label}
              onNavigate={props.onNavigate}
              onView={props.onView}
              view={effectiveView}
              availableViews={availableViews}
              isMobile={isMobile}
              date={date}
              onDateChange={handleNavigate}
            />
          ),
          month: {
            dateHeader: MonthDateHeader,
          },
          showMore: ShowMoreButton as any,
        }}
        onDrillDown={handleCellClick}
        onShowMore={(_events, moreDate) => handleCellClick(moreDate)}
      />
      <style>
        {`
          .rbc-month-view .rbc-date-cell {
            cursor: pointer;
            transition: background-color 120ms ease, box-shadow 120ms ease;
          }
          .rbc-month-view .rbc-date-cell:hover {
            background-color: #f9fafb;
          }
          /* Let dates hover; disable row scaffolding from blocking hover/click */
          .rbc-month-view .rbc-row,
          .rbc-month-view .rbc-row-content {
            pointer-events: none !important;
            background: transparent !important;
          }
          .rbc-month-view .rbc-date-cell,
          .rbc-month-view .rbc-event,
          .rbc-month-view .rbc-show-more {
            pointer-events: auto !important;
            z-index: 10 !important;
          }
          .rbc-event {
            max-width: 100% !important;
            overflow: hidden !important;
          }
          .rbc-event-content {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}
      </style>
      <DayEventsDialog
        open={dayDialogOpen}
        onOpenChange={handleDayDialogChange}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        selectable={selectable}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dayEvents={dayEvents}
        renderAddContent={renderAddContent}
        onAddSessionClick={handleAddSessionClick}
        renderInlineEventEditor={renderInlineEventEditor}
        onInlineEditSelect={onInlineEditSelect}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}
