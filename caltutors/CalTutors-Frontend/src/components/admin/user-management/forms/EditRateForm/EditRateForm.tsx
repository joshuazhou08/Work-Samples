import { useState, useEffect } from "react";
import { Save, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface EditRateFormProps {
  isOpen: boolean;
  onClose: () => void;
  rate: any;
  userName: string;
  onUpdate: (data: {
    studentRate: string;
    tutorPayRate: string;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function EditRateForm({
  isOpen,
  onClose,
  rate,
  userName,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: EditRateFormProps) {
  const [studentRate, setStudentRate] = useState(rate.student_rate);
  const [tutorPayRate, setTutorPayRate] = useState(rate.tutor_pay_rate);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (rate) {
      setStudentRate(rate.student_rate);
      setTutorPayRate(rate.tutor_pay_rate);
    }
  }, [rate]);

  const handleUpdate = async () => {
    await onUpdate({ studentRate, tutorPayRate });
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    await onDelete();
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Rate - {userName}</DialogTitle>
          <DialogDescription>
            Update the student rate and tutor pay rate for this assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editStudentRate">Student Rate ($/hr)</Label>
              <Input
                id="editStudentRate"
                type="number"
                step="0.01"
                min="0"
                value={studentRate}
                onChange={(e) => setStudentRate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editTutorPayRate">Tutor Pay Rate ($/hr)</Label>
              <Input
                id="editTutorPayRate"
                type="number"
                step="0.01"
                min="0"
                value={tutorPayRate}
                onChange={(e) => setTutorPayRate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            disabled={isDeleting || isUpdating}
            className="gap-2"
          >
            <Trash2 size={16} />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isUpdating || isDeleting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || isDeleting}>
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Rate"
        message={`Are you sure you want to delete the rate for ${userName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </Dialog>
  );
}
