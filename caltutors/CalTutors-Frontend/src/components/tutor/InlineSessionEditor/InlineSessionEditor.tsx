import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { SessionFormFields } from "@/components/tutor/SessionFormDialog/SessionFormFields";
import { Button } from "@/components/ui/button";
import { convertLocalToUTC } from "@/utils/timezone";
import type { CreateSessionData } from "@/types/session_management";
import type { CalendarSession } from "@/components/ui/dashboard";
import { Session } from "@/types/session_management";

export interface SessionFormData {
  student: string;
  time: string;
  duration: string;
  date: string;
}

interface InlineSessionFormProps {
  formData: SessionFormData;
  onFormChange: (field: keyof SessionFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void;
  availableStudents: {
    id: number;
    first_name: string;
    last_name: string;
    client_name?: string;
  }[];
  isEditing: boolean;
  isMutating?: boolean;
  error?: Error | null;
  selectedDate: Date | null;
  onClose: () => void;
  compact?: boolean;
}

export function InlineSessionForm({
  formData,
  onFormChange,
  onSubmit,
  onDelete,
  availableStudents,
  isEditing,
  isMutating,
  error,
  selectedDate,
  onClose,
  compact = false,
}: InlineSessionFormProps) {
  useEffect(() => {
    if (!isEditing && selectedDate) {
      const formatted = format(selectedDate, "yyyy-MM-dd");
      if (formatted !== formData.date) {
        onFormChange("date", formatted);
      }
    }
  }, [isEditing, selectedDate, formData.date, onFormChange]);

  const containerClasses = compact
    ? "space-y-3 rounded-lg border border-gray-200 p-3"
    : "space-y-4 rounded-lg border border-gray-200 p-4";

  return (
    <div className={containerClasses}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {isEditing ? "Edit session" : "Create session"}
          </p>
          <p className="text-xs text-gray-600">
            {selectedDate
              ? format(selectedDate, "EEEE, MMM d")
              : "Pick a date to prefill the form."}
          </p>
        </div>
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          onClick={onClose}
        >
          Close
        </Button>
      </div>

      <form onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-4"}>
        <SessionFormFields
          formData={formData}
          onFormChange={onFormChange}
          availableStudents={availableStudents}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
            <span>{error.message || "An error occurred"}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 justify-between">
          {isEditing && onDelete && (
            <Button
              type="button"
              onClick={onDelete}
              disabled={isMutating}
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              size={compact ? "sm" : "default"}
            >
              {isMutating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          )}
          <Button
            type="submit"
            disabled={isMutating}
            className="ml-auto"
            size={compact ? "sm" : "default"}
          >
            {isMutating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isMutating
              ? "Saving..."
              : isEditing
              ? "Update Session"
              : "Create Session"}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface InlineSessionEditorProps {
  event: CalendarSession;
  toFormData: (event: CalendarSession) => SessionFormData;
  availableStudents: {
    id: number;
    first_name: string;
    last_name: string;
    client_name?: string;
  }[];
  isMutating: boolean;
  error: Error | null;
  onUpdate: (sessionId: number, data: CreateSessionData) => Promise<Session>;
  onDelete: (sessionId: number) => Promise<void>;
  tutorId: number;
  close: () => void;
}

export function InlineSessionEditor({
  event,
  toFormData,
  availableStudents,
  isMutating,
  error,
  onUpdate,
  onDelete,
  tutorId,
  close,
}: InlineSessionEditorProps) {
  const [formData, setFormData] = useState<SessionFormData>(toFormData(event));
  const [localError, setLocalError] = useState<Error | null>(null);

  useEffect(() => {
    setFormData(toFormData(event));
    setLocalError(null);
  }, [event, toFormData]);

  const handleFormChange = (field: keyof SessionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const sessionData: CreateSessionData = {
      student: parseInt(formData.student),
      tutor: tutorId,
      start_time: convertLocalToUTC(formData.date, formData.time),
      duration_minutes: parseInt(formData.duration),
    };

    if (event.resource) {
      try {
        await onUpdate(event.resource.id, sessionData);
      } catch (err: any) {
        setLocalError(err);
      }
    }
  };

  const handleDelete = async () => {
    if (!event.resource) return;
    setLocalError(null);
    try {
      await onDelete(event.resource.id);
      close();
    } catch (err: any) {
      setLocalError(err);
    }
  };

  return (
    <InlineSessionForm
      formData={formData}
      onFormChange={handleFormChange}
      onSubmit={handleSubmit}
      onDelete={event.resource ? handleDelete : undefined}
      availableStudents={availableStudents}
      isEditing={true}
      isMutating={isMutating}
      error={localError || error}
      selectedDate={event.start}
      onClose={close}
      compact
    />
  );
}
