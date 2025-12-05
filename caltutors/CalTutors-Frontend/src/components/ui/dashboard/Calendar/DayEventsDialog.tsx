"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CalendarSession } from "./types";

interface DayEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedSlot: { start: Date; end: Date } | null;
  selectable: boolean;
  activeTab: "events" | "add";
  onTabChange: (tab: "events" | "add") => void;
  dayEvents: CalendarSession[];
  renderAddContent?: (context: {
    selectedDate: Date | null;
    selectedSlot: { start: Date; end: Date } | null;
    closeDialog: () => void;
  }) => ReactNode;
  onAddSessionClick?: () => void;
  renderInlineEventEditor?: (context: {
    event: CalendarSession;
    close: () => void;
  }) => ReactNode;
  onInlineEditSelect?: (session: CalendarSession) => void;
  onSelectEvent?: (session: CalendarSession) => void;
}

export function DayEventsDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedSlot,
  selectable,
  activeTab,
  onTabChange,
  dayEvents,
  renderAddContent,
  onAddSessionClick,
  renderInlineEventEditor,
  onInlineEditSelect,
  onSelectEvent,
}: DayEventsDialogProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setExpandedEventId(null);
    }
  }, [open]);

  const closeDialog = useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleViewEvent = useCallback(
    (event: CalendarSession) => {
      if (selectable && renderInlineEventEditor) {
        setExpandedEventId((prev) => {
          const next = prev === event.id ? null : event.id;
          if (next && onInlineEditSelect) {
            onInlineEditSelect(event);
          }
          return next;
        });
      } else if (selectable && onSelectEvent) {
        closeDialog();
        onSelectEvent(event);
      } else {
        setExpandedEventId((prev) => (prev === event.id ? null : event.id));
      }
    },
    [closeDialog, onInlineEditSelect, onSelectEvent, renderInlineEventEditor, selectable]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-3">
          <DialogTitle>
            {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Day"}
          </DialogTitle>
          <DialogDescription>
            {selectedDate
              ? "Browse every event scheduled for this day."
              : "Select a day to view its events."}
          </DialogDescription>
        </DialogHeader>

        {selectable && (
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={activeTab === "add" ? "default" : "outline"}
              onClick={() => onTabChange("add")}
            >
              Add session
            </Button>
            <Button
              type="button"
              variant={activeTab === "events" ? "default" : "outline"}
              onClick={() => onTabChange("events")}
            >
              View events
            </Button>
          </div>
        )}

        {(activeTab === "add" || !selectable) && selectable && (
          <div className="space-y-3">
            {renderAddContent ? (
              renderAddContent({
                selectedDate,
                selectedSlot,
                closeDialog,
              })
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Start a new session on{" "}
                  {selectedDate ? format(selectedDate, "PPP") : "this day"}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={onAddSessionClick}
                    disabled={!selectedSlot}
                  >
                    Open session form
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onTabChange("events")}
                  >
                    View scheduled events
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "events" || !selectable ? (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {dayEvents.length === 0 && (
              <p className="text-sm text-gray-600">
                No events scheduled for this day.
              </p>
            )}
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {format(event.start, "p")} - {format(event.end, "p")}
                    </p>
                    <p className="text-xs text-gray-500">{event.student}</p>
                  </div>
                  {onSelectEvent && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewEvent(event)}
                    >
                      {selectable && renderInlineEventEditor
                        ? expandedEventId === event.id
                          ? "Hide"
                          : "Edit"
                        : selectable
                          ? "Edit"
                          : expandedEventId === event.id
                            ? "Hide"
                            : "View"}
                    </Button>
                  )}
                </div>
                {expandedEventId === event.id &&
                  (selectable && renderInlineEventEditor ? (
                    renderInlineEventEditor({
                      event,
                      close: () => setExpandedEventId(null),
                    })
                  ) : (
                    <div className="rounded-md bg-gray-50 p-2 text-xs text-gray-700 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-semibold">Time</span>
                        <span>
                          {format(event.start, "p")} - {format(event.end, "p")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Student</span>
                        <span>{event.student}</span>
                      </div>
                      {event.resource && (
                        <div className="flex justify-between">
                          <span className="font-semibold">Duration</span>
                          <span>
                            {Math.round(
                              (event.end.getTime() - event.start.getTime()) /
                                (1000 * 60)
                            )}{" "}
                            min
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
