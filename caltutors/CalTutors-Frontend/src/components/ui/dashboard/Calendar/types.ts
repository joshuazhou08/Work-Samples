import type { CSSProperties } from "react";
import type { Session } from "@/types/session_management";

export interface CalendarSession {
  id: string;
  title: string;
  start: Date;
  end: Date;
  student: string;
  studentId: number;
  resource?: Session;
}

export interface CalendarProps {
  sessions: Session[];
  isLoading?: boolean;
  isError?: boolean;
  error?: any;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent?: (session: CalendarSession) => void;
  onInlineEditSelect?: (session: CalendarSession) => void;
  onCellClick?: (date: Date) => void;
  selectable?: boolean;
  renderAddContent?: (context: {
    selectedDate: Date | null;
    selectedSlot: { start: Date; end: Date } | null;
    closeDialog: () => void;
  }) => React.ReactNode;
  renderInlineEventEditor?: (context: {
    event: CalendarSession;
    close: () => void;
  }) => React.ReactNode;
  eventPropGetter?: (
    event: CalendarSession,
    start: Date,
    end: Date,
    isSelected: boolean
  ) => {
    className?: string;
    style?: CSSProperties;
  };
}
