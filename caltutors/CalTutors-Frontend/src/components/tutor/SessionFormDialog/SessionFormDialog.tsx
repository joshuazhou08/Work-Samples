import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SessionFormFields } from "./SessionFormFields";

interface SessionFormData {
  student: string;
  time: string;
  duration: string;
  date: string;
}

interface AvailableStudent {
  id: number;
  first_name: string;
  last_name: string;
  client_name?: string;
}

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: SessionFormData;
  onFormChange: (field: keyof SessionFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void;
  availableStudents: AvailableStudent[];
  isEditing: boolean;
  isMutating?: boolean;
  error?: Error | null;
}

export function SessionFormDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  onDelete,
  availableStudents,
  isEditing,
  isMutating,
  error,
}: SessionFormDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (typeof window !== "undefined" && !isOpen) {
      window.dispatchEvent(new CustomEvent("ct-calendar-event-dialog-closed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Session" : "Schedule New Session"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <SessionFormFields
            formData={formData}
            onFormChange={onFormChange}
            availableStudents={availableStudents}
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-md text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error.message || "An error occurred"}</span>
            </div>
          )}

          <DialogFooter className="gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                onClick={onDelete}
                disabled={isMutating}
                variant="outline"
                className="text-red-600 hover:bg-red-50"
              >
                {isMutating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            )}
            <Button type="submit" disabled={isMutating} className="flex-1">
              {isMutating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isMutating
                ? "Saving..."
                : isEditing
                ? "Update Session"
                : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
