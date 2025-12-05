"use client";

import { useEffect, useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { StudentFormDialog } from "../StudentFormDialog";
import { useUpdateStudent, useDeleteStudent } from "@/hooks/student_management";
import type { Student } from "@/types/students";
import type { CreateStudentData } from "@/types/students";
import { convertToE164 } from "@/utils/phoneUtils";
import { getErrorMessage } from "@/utils/errors";

interface EditStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess?: () => void;
}

export function EditStudentForm({
  isOpen,
  onClose,
  student,
  onSuccess,
}: EditStudentFormProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(student);
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  useEffect(() => {
    setCurrentStudent(student);
  }, [student]);

  const handleUpdate = async (values: CreateStudentData) => {
    const formattedPhoneNumber = values.phone_number
      ? convertToE164(values.phone_number)
      : undefined;

    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email || undefined,
      phone_number: formattedPhoneNumber,
      grade_level: values.grade_level || undefined,
      subjects_studying: values.subjects_studying || undefined,
      notes: values.notes || undefined,
    };

    updateStudentMutation.mutate(
      {
        studentId: currentStudent.id,
        data: payload,
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
      }
    );
  };

  const handleDeleteConfirm = async () => {
    deleteStudentMutation.mutate(
      { studentId: currentStudent.id },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          onClose();
          onSuccess?.();
        },
      }
    );
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      updateStudentMutation.reset();
      deleteStudentMutation.reset();
      setShowDeleteConfirm(false);
      onClose();
      return;
    }

    setCurrentStudent(student);
  };

  const errorMessage = updateStudentMutation.error
    ? getErrorMessage(updateStudentMutation.error)
    : null;

  return (
    <>
      <StudentFormDialog
        mode="edit"
        open={isOpen}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleUpdate}
        isSubmitting={updateStudentMutation.isPending}
        errorMessage={errorMessage}
        initialValues={{
          first_name: currentStudent.first_name,
          last_name: currentStudent.last_name,
          email: currentStudent.email ?? "",
          phone_number: currentStudent.phone_number ?? "",
          grade_level: currentStudent.grade_level ?? "",
          subjects_studying: currentStudent.subjects_studying ?? "",
          notes: currentStudent.notes ?? "",
        }}
        title={`Edit Student - ${currentStudent.first_name} ${currentStudent.last_name}`}
        description="Update the student's information."
        primaryActionLabel="Save Changes"
        cancelLabel="Cancel"
        deleteAction={{
          label: "Delete Student",
          onClick: () => setShowDeleteConfirm(true),
          isDeleting: deleteStudentMutation.isPending,
          disabled:
            updateStudentMutation.isPending || deleteStudentMutation.isPending,
        }}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message={`Are you sure you want to delete ${currentStudent.first_name} ${currentStudent.last_name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteStudentMutation.isPending}
      />
    </>
  );
}
