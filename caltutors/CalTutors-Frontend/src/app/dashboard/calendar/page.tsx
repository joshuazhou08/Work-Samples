"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ClientCalendar } from "@/components/client/calendar";
import { TutorCalendar } from "@/components/tutor";

export default function CalendarPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const renderCalendar = () => {
    switch (user.user_type) {
      case "client":
        return <ClientCalendar clientId={user.id} />;
      case "tutor":
        return <TutorCalendar tutorId={user.id} />;
      default:
        return null;
    }
  };

  return <div className="h-screen flex flex-col">{renderCalendar()}</div>;
}
