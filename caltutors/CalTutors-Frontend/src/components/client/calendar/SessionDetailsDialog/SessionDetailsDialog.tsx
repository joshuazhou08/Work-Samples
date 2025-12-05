import { Calendar, Clock, User, GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Session } from "@/types/session_management";

interface SessionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
}

export function SessionDetailsDialog({
  open,
  onOpenChange,
  session,
}: SessionDetailsDialogProps) {
  if (!session) return null;

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (typeof window !== "undefined" && !isOpen) {
      window.dispatchEvent(new CustomEvent("ct-calendar-event-dialog-closed"));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-gray-900">{formatDate(session.start_time)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Time</p>
              <p className="text-gray-900">
                {formatTime(session.start_time)} -{" "}
                {formatTime(session.end_time)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {session.duration_minutes} minutes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Tutor</p>
              <p className="text-gray-900">
                {session.tutor_info.first_name} {session.tutor_info.last_name}
              </p>
              <p className="text-sm text-gray-500">
                {session.tutor_info.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Student</p>
              <p className="text-gray-900">
                {session.student_info.first_name}{" "}
                {session.student_info.last_name}
              </p>
            </div>
          </div>

          {session.student_rate && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-2">Rate</p>
              <p className="text-gray-900">${session.student_rate}/hour</p>
            </div>
          )}

          {session.student_charged && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">
                ✓ {session.tutor_paid
                  ? "This session has been fully paid"
                  : "This session has been charged to the student"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
