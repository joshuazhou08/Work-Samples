"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { Plus, AlertCircle } from "lucide-react";
import {
  Calendar,
  CalendarSession,
  roundToNearest15Minutes,
} from "@/components/ui/dashboard";
import { SessionFormDialog } from "@/components/tutor/SessionFormDialog";
import {
  useSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useAvailableStudents,
} from "@/hooks/session_management";
import { convertLocalToUTC } from "@/utils/timezone";
import type { CreateSessionData } from "@/types/session_management";
import { Button } from "@/components/ui/button";
import {
  InlineSessionForm,
  InlineSessionEditor,
  type SessionFormData,
} from "@/components/tutor/InlineSessionEditor/InlineSessionEditor";

interface TutorCalendarProps {
  tutorId: number;
}

export function TutorCalendar({ tutorId }: TutorCalendarProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<CalendarSession | null>(
    null
  );
  const [formData, setFormData] = useState<SessionFormData>({
    student: "",
    time: "",
    duration: "60",
    date: "",
  });

  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
  } = useSessions({ tutor_id: tutorId });
  const { data: availableStudentsData, isError: studentsError } =
    useAvailableStudents();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const availableStudents = availableStudentsData?.students || [];
  const isMutating =
    createSession.isPending ||
    updateSession.isPending ||
    deleteSession.isPending;
  const mutationError =
    createSession.error || updateSession.error || deleteSession.error;

  const toFormData = useCallback((event: CalendarSession): SessionFormData => {
    return {
      student: event.studentId.toString(),
      time: roundToNearest15Minutes(event.start),
      duration: String(
        (event.end.getTime() - event.start.getTime()) / (1000 * 60)
      ),
      date: format(event.start, "yyyy-MM-dd"),
    };
  }, []);

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date; end: Date }) => {
      setEditingSession(null);
      setFormData({
        student: "",
        time: roundToNearest15Minutes(start),
        duration: "60",
        date: format(start, "yyyy-MM-dd"),
      });
    },
    []
  );

  const handleSelectEvent = useCallback(
    (event: CalendarSession) => {
      setEditingSession(event);
      setFormData(toFormData(event));
      setShowForm(true);
    },
    [toFormData]
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student || !formData.time || !formData.date) return;

    const sessionData: CreateSessionData = {
      student: parseInt(formData.student),
      tutor: tutorId,
      start_time: convertLocalToUTC(formData.date, formData.time),
      duration_minutes: parseInt(formData.duration),
    };

    if (editingSession?.resource) {
      await updateSession.mutateAsync({
        sessionId: editingSession.resource.id,
        sessionData,
      });
    } else {
      await createSession.mutateAsync(sessionData);
    }

    handleCloseForm();
  };

  const handleDelete = async () => {
    if (editingSession?.resource) {
      await deleteSession.mutateAsync(editingSession.resource.id);
      handleCloseForm();
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSession(null);
    setFormData({
      student: "",
      time: "",
      duration: "60",
      date: "",
    });
  };

  const handleFormChange = (field: keyof SessionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSession = () => {
    setEditingSession(null);
    setFormData({
      student: "",
      time: roundToNearest15Minutes(new Date()),
      duration: "60",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setShowForm(true);
  };

  const handleCellClick = (date: Date) => {
    setEditingSession(null);
    setFormData({
      student: "",
      time: roundToNearest15Minutes(date),
      duration: "60",
      date: format(date, "yyyy-MM-dd"),
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8 px-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
          <p className="text-base text-gray-600">
            Manage your tutoring sessions • Click any calendar cell to schedule
            a new session
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Tip: On crowded days, hit "View all" to open the add form and include extra sessions.
          </p>
        </div>
        <Button
          type="button"
          variant="default"
          size="lg"
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all shadow-sm transform hover:-translate-y-0.5"
          onClick={handleAddSession}
        >
          <Plus size={16} />
          Add Session
        </Button>
      </div>

      {studentsError && (
        <div className="flex items-center gap-2 p-3 mx-4 mb-4 bg-amber-50 border border-amber-500 rounded-lg text-amber-900 text-sm">
          <AlertCircle size={16} />
          <span>
            Failed to load available students. You may not be able to create new
            sessions.
          </span>
        </div>
      )}

      <Calendar
        sessions={sessions}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable={true}
        onCellClick={handleCellClick}
        renderAddContent={({ selectedDate, closeDialog }) => (
          <InlineSessionForm
            formData={formData}
            onFormChange={handleFormChange}
            onSubmit={(e) => {
              handleFormSubmit(e);
              closeDialog();
            }}
            onDelete={editingSession ? handleDelete : undefined}
            availableStudents={availableStudents}
            isEditing={!!editingSession}
            isMutating={isMutating}
            error={mutationError}
            selectedDate={selectedDate}
            onClose={closeDialog}
            compact
          />
        )}
        renderInlineEventEditor={({ event, close }) => (
          <InlineSessionEditor
            event={event}
            toFormData={toFormData}
            availableStudents={availableStudents}
            isMutating={isMutating}
            error={mutationError}
            onUpdate={(sessionId, data) =>
              updateSession.mutateAsync({ sessionId, sessionData: data })
            }
            onDelete={(sessionId) => deleteSession.mutateAsync(sessionId)}
            tutorId={tutorId}
            close={close}
          />
        )}
      />

      <SessionFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleFormSubmit}
        onDelete={editingSession ? handleDelete : undefined}
        availableStudents={availableStudents}
        isEditing={!!editingSession}
        isMutating={isMutating}
        error={mutationError}
      />
    </>
  );
}
