import { format } from "date-fns";
import type { Session } from "@/types/session_management";
import type { CalendarSession } from "./types";
import { convertUTCToLocal } from "@/utils/timezone";

export const apiSessionToCalendarSession = (
  session: Session
): CalendarSession => {
  const startDate = convertUTCToLocal(session.start_time);
  const endDate = convertUTCToLocal(session.end_time);
  const firstName = session.student_info?.first_name ?? "Student";
  const lastName = session.student_info?.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: session.id.toString(),
    title: fullName || "Session",
    start: startDate,
    end: endDate,
    student: fullName,
    studentId: session.student,
    resource: session,
  };
};

export const roundToNearest15Minutes = (date: Date) => {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 15) * 15;
  const roundedDate = new Date(date);
  roundedDate.setMinutes(roundedMinutes, 0, 0);
  return format(roundedDate, "HH:mm");
};

export const generateTimeOptions = () => {
  const times = [];
  for (let hour = 7; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const displayTime = new Date(0, 0, 0, hour, minute).toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      );
      times.push({ value: timeString, label: displayTime });
    }
  }
  return times;
};
