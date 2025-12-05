"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PORTAL_OFFSET = 8;
const VIEWPORT_PADDING = 12;
const PREFERRED_PANEL_HEIGHT = 420;
const MIN_PANEL_HEIGHT = 240;
const PREFERRED_PANEL_WIDTH = 320;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DatePickerProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

type PanelMetrics = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const computePanelMetrics = (
  triggerRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number
): PanelMetrics => {
  const width = Math.min(
    PREFERRED_PANEL_WIDTH,
    viewportWidth - VIEWPORT_PADDING * 2
  );

  const left = Math.min(
    Math.max(triggerRect.left, VIEWPORT_PADDING),
    viewportWidth - width - VIEWPORT_PADDING
  );

  const spaceBelow =
    viewportHeight - triggerRect.bottom - VIEWPORT_PADDING - PORTAL_OFFSET;
  const spaceAbove =
    triggerRect.top - VIEWPORT_PADDING - PORTAL_OFFSET;

  const availableHeight = Math.max(
    MIN_PANEL_HEIGHT,
    viewportHeight - VIEWPORT_PADDING * 2
  );

  const spacePreferred = Math.min(PREFERRED_PANEL_HEIGHT, availableHeight);

  const shouldOpenAbove =
    spaceAbove > spaceBelow && spaceAbove > MIN_PANEL_HEIGHT;

  let top: number;
  let maxHeight: number;

  if (shouldOpenAbove) {
    maxHeight = Math.min(spaceAbove, spacePreferred);
    if (maxHeight < MIN_PANEL_HEIGHT) {
      maxHeight = Math.max(spaceAbove, MIN_PANEL_HEIGHT);
    }
    top = triggerRect.top - PORTAL_OFFSET - maxHeight;
    if (top < VIEWPORT_PADDING) {
      const delta = VIEWPORT_PADDING - top;
      top = VIEWPORT_PADDING;
      maxHeight = Math.max(maxHeight - delta, MIN_PANEL_HEIGHT);
    }
  } else {
    maxHeight = Math.min(spaceBelow, spacePreferred);
    if (maxHeight < MIN_PANEL_HEIGHT) {
      maxHeight = Math.max(spaceBelow, MIN_PANEL_HEIGHT);
    }
    top = triggerRect.bottom + PORTAL_OFFSET;
    if (top + maxHeight > viewportHeight - VIEWPORT_PADDING) {
      const overflow =
        top + maxHeight - (viewportHeight - VIEWPORT_PADDING);
      top = Math.max(VIEWPORT_PADDING, top - overflow);
      maxHeight = Math.max(maxHeight - overflow, MIN_PANEL_HEIGHT);
    }
  }

  return {
    top,
    left,
    width,
    maxHeight: Math.min(maxHeight, availableHeight),
  };
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() =>
    value ? new Date(`${value}T00:00:00`) : new Date()
  );
  const [panelMetrics, setPanelMetrics] = useState<PanelMetrics | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPanelMetrics(null);
      return;
    }

    const trigger = triggerRef.current;
    if (!trigger) return;

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect();
      setPanelMetrics(
        computePanelMetrics(rect, window.innerWidth, window.innerHeight)
      );
    };

    updatePosition();
    const handleWindowChange = () => updatePosition();
    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && value) {
      setCurrentMonth(new Date(`${value}T00:00:00`));
    }
  }, [isOpen, value]);

  const closePicker = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closePicker();
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePicker();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [closePicker, isOpen]);

  const displayValue = value
    ? format(new Date(`${value}T00:00:00`), "MMM d, yyyy")
    : placeholder;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const visibleStart = startOfWeek(monthStart);
  const visibleEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: visibleStart, end: visibleEnd });
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;

  const handleSelect = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen((open) => !open);
    }
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTriggerClick();
    }
  };

  const handlePanelWheelCapture = (event: React.WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const panelContent =
    isOpen && panelMetrics && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={(node) => {
              panelRef.current = node;
            }}
            className="pointer-events-auto"
            style={{
              position: "fixed",
              top: panelMetrics.top,
              left: panelMetrics.left,
              width: panelMetrics.width,
              zIndex: 1300,
            }}
            data-dialog-allow-outside-interaction
          >
            <div
              className="relative bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-full overflow-y-auto overscroll-contain touch-pan-y"
              style={{ maxHeight: panelMetrics.maxHeight }}
              onWheelCapture={handlePanelWheelCapture}
            >
              <Button
                variant="close"
                size="icon"
                className="absolute right-4 top-4"
                aria-label="Close date picker"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close date picker</span>
              </Button>

              <div className="mb-4 flex items-center justify-between pr-10">
                <button
                  type="button"
                  onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <p className="text-sm font-semibold text-gray-800">
                  {format(currentMonth, "MMMM yyyy")}
                </p>

                <button
                  type="button"
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {DAY_LABELS.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 pb-4">
                  {days.map((day) => {
                    const isCurrent = isSameMonth(day, currentMonth);
                    const isSelected =
                      !!selectedDate && isSameDay(day, selectedDate);
                    const highlightToday = isToday(day);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleSelect(day)}
                        className={cn(
                          "relative flex h-10 w-full items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                          isSelected
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : isCurrent
                            ? "text-gray-700 hover:bg-gray-100"
                            : "text-gray-300 hover:bg-gray-50",
                          highlightToday && !isSelected
                            ? "font-semibold text-blue-600"
                            : ""
                        )}
                        aria-label={format(day, "EEEE, MMMM d, yyyy")}
                      >
                        {format(day, "d")}
                        {highlightToday && !isSelected ? (
                          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex justify-center border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => handleSelect(new Date())}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Today
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors",
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          isOpen && !disabled
            ? "border-blue-500 shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
            : ""
        )}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span
          className={cn(
            "truncate text-left",
            value ? "font-medium text-gray-800" : "text-gray-400"
          )}
        >
          {displayValue}
        </span>
        <Calendar className="ml-3 h-4 w-4 text-gray-500" aria-hidden />
      </button>

      {panelContent}
    </div>
  );
}
