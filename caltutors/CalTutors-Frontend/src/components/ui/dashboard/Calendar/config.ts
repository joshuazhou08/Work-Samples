import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import type { CalendarSession } from "./types";

export const locales = {
  "en-US": enUS,
};

export const eventStyleGetter = (event: CalendarSession) => {
  return {
    className: "ct-calendar-event ct-calendar-event--default",
    style: {
      backgroundColor: "#3b82f6",
      borderRadius: "4px",
      opacity: 0.9,
      color: "white",
      border: "0px",
      display: "block",
      fontSize: "0.75rem",
      fontWeight: "500",
      padding: "2px 4px",
    },
  };
};

export const dayPropGetter = (date: Date) => {
  const isToday =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const isPast = date < new Date() && !isToday;

  return {
    style: {
      backgroundColor: isToday ? "#fef3c7" : isPast ? "#f9fafb" : "white",
    },
  };
};

export const calendarFormats = {
  timeGutterFormat: (date: Date, culture?: string, localizer?: any) =>
    localizer.format(date, "HH:mm", culture),
  eventTimeRangeFormat: (
    { start, end }: { start: Date; end: Date },
    culture?: string,
    localizer?: any
  ) =>
    `${localizer.format(start, "HH:mm", culture)} - ${localizer.format(
      end,
      "HH:mm",
      culture
    )}`,
  agendaTimeRangeFormat: (
    { start, end }: { start: Date; end: Date },
    culture?: string,
    localizer?: any
  ) =>
    `${localizer.format(start, "HH:mm", culture)} - ${localizer.format(
      end,
      "HH:mm",
      culture
    )}`,
};
