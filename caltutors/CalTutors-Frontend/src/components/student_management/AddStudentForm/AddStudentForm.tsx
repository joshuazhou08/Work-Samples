"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentFormDialog } from "../StudentFormDialog";
import { useCreateStudent } from "@/hooks/student_management";
import type { CreateStudentData } from "@/types/students";
import { convertToE164 } from "@/utils/phoneUtils";
import { getErrorMessage } from "@/utils/errors";
import { cn } from "@/lib/utils";

interface AddStudentFormProps {
  clientId?: number;
  onSuccess?: () => void;
  triggerClassName?: string;
}

export function AddStudentForm({
  clientId,
  onSuccess,
  triggerClassName,
}: AddStudentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const createStudentMutation = useCreateStudent();

  const errorMessage = createStudentMutation.error
    ? getErrorMessage(createStudentMutation.error)
    : null;

  const handleSubmit = async (values: CreateStudentData) => {
    const formattedPhoneNumber = values.phone_number
      ? convertToE164(values.phone_number)
      : undefined;

    createStudentMutation.mutate(
      {
        data: {
          ...values,
          phone_number: formattedPhoneNumber,
        },
        clientId,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          onSuccess?.();
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsOpen(false);
      createStudentMutation.reset();
      return;
    }

    setIsOpen(true);
  };

  return (
    <>
      <Button
        onClick={() => handleOpenChange(true)}
        className={cn("gap-2", triggerClassName)}
      >
        <Plus size={16} />
        Add Student
      </Button>

      <StudentFormDialog
        mode="create"
        open={isOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        isSubmitting={createStudentMutation.isPending}
        errorMessage={errorMessage}
        title="Add New Student"
        description="Create a new student profile for this client."
        primaryActionLabel="Add Student"
      />
    </>
  );
}
