"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneNumberInput } from "@/components/ui/general";
import type { CreateStudentData } from "@/types/students";

type StudentFormMode = "create" | "edit";

export interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: StudentFormMode;
  onSubmit: (values: CreateStudentData) => void | Promise<void>;
  isSubmitting?: boolean;
  initialValues?: Partial<CreateStudentData>;
  errorMessage?: string | null;
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  cancelLabel?: string;
  deleteAction?: {
    label?: string;
    onClick: () => void;
    isDeleting?: boolean;
    disabled?: boolean;
  };
}

const defaultValues: CreateStudentData = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  grade_level: "",
  subjects_studying: "",
  notes: "",
};

export function StudentFormDialog({
  open,
  onOpenChange,
  mode,
  onSubmit,
  isSubmitting = false,
  initialValues,
  errorMessage,
  title,
  description,
  primaryActionLabel,
  cancelLabel = "Cancel",
  deleteAction,
}: StudentFormDialogProps) {
  const mergedInitialValues = useMemo(() => {
    return { ...defaultValues, ...(initialValues ?? {}) };
  }, [initialValues]);

  const [formValues, setFormValues] =
    useState<CreateStudentData>(mergedInitialValues);
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  useEffect(() => {
    if (open) {
      setFormValues(mergedInitialValues);
      setIsPhoneValid(true);
    }
  }, [mergedInitialValues, open]);

  const handleChange =
    (field: keyof CreateStudentData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      ...formValues,
      email: formValues.email || undefined,
      phone_number: formValues.phone_number || undefined,
      grade_level: formValues.grade_level || undefined,
      subjects_studying: formValues.subjects_studying || undefined,
      notes: formValues.notes || undefined,
    });
  };

  const resolvedTitle =
    title ??
    (mode === "edit" ? "Edit Student Information" : "Add a New Student");
  const resolvedDescription =
    description ??
    (mode === "edit"
      ? "Update the details for this student. All fields are optional unless marked required."
      : "Provide details about your student so tutors can tailor their approach.");
  const resolvedPrimaryActionLabel =
    primaryActionLabel ?? (mode === "edit" ? "Save Changes" : "Add Student");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student-first-name">First Name *</Label>
              <Input
                id="student-first-name"
                value={formValues.first_name}
                onChange={handleChange("first_name")}
                placeholder="Taylor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-last-name">Last Name *</Label>
              <Input
                id="student-last-name"
                value={formValues.last_name}
                onChange={handleChange("last_name")}
                placeholder="Jordan"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={formValues.email ?? ""}
                onChange={handleChange("email")}
                placeholder="taylor@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-phone">Phone Number</Label>
              <PhoneNumberInput
                id="student-phone"
                value={formValues.phone_number ?? ""}
                onChange={(value, meta) => {
                  setFormValues((prev) => ({ ...prev, phone_number: value }));
                  setIsPhoneValid(meta?.isValid ?? true);
                }}
                onValidityChange={(valid) => setIsPhoneValid(valid)}
                validate
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student-grade">Grade Level</Label>
              <Input
                id="student-grade"
                value={formValues.grade_level ?? ""}
                onChange={handleChange("grade_level")}
                placeholder="8th Grade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-subjects">Subjects Studying</Label>
              <Input
                id="student-subjects"
                value={formValues.subjects_studying ?? ""}
                onChange={handleChange("subjects_studying")}
                placeholder="Algebra, English"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-notes">Notes</Label>
            <textarea
              id="student-notes"
              value={formValues.notes ?? ""}
              onChange={handleChange("notes")}
              placeholder="Learning preferences, goals, or anything else tutors should know."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[100px]"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <DialogFooter className="flex items-center gap-3">
            {deleteAction && (
              <Button
                type="button"
                variant="outline"
                onClick={deleteAction.onClick}
                disabled={deleteAction.disabled || deleteAction.isDeleting}
                className="mr-auto text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleteAction.isDeleting ? "Deleting..." : deleteAction.label ?? "Delete Student"}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (!isPhoneValid && !!formValues.phone_number?.trim())
              }
            >
              {isSubmitting ? "Saving..." : resolvedPrimaryActionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
