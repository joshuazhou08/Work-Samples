"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, DollarSign, User as UserIcon, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudentRates, useTutorRates } from "@/hooks/admin_management";
import {
  useAdminTutors,
  useCreateRate,
  useUpdateRate,
  useDeleteRate,
} from "@/hooks/admin_management";
import { useStudents } from "@/hooks/student_management";
import type { CreateRateData } from "@/types/admin_management";
import { AssignRateForm } from "@/components/admin/user-management/forms/AssignRateForm";
import { EditRateForm } from "@/components/admin/user-management/forms/EditRateForm";

interface RatesCardProps {
  userType: "tutor" | "student";
  userId: number;
  variant?: "default" | "compact";
}

export function RatesCard({
  userType,
  userId,
  variant = "default",
}: RatesCardProps) {
  const [editingRate, setEditingRate] = useState<any>(null);

  const { data: rates = [], isLoading: ratesLoading } =
    userType === "student" ? useStudentRates(userId) : useTutorRates(userId);

  const { data: tutors = [] } = useAdminTutors();
  const { data: studentList } = useStudents();
  const students = studentList?.students ?? [];
  const createRate = useCreateRate();
  const updateRate = useUpdateRate();
  const deleteRate = useDeleteRate();

  const availableUsers = userType === "student" ? tutors : students;

  const handleCreateRate = async (data: {
    userId: string;
    studentRate: string;
    tutorPayRate: string;
  }) => {
    const rateData: CreateRateData = {
      tutor: userType === "student" ? parseInt(data.userId) : userId,
      student: userType === "student" ? userId : parseInt(data.userId),
      student_rate: data.studentRate,
      tutor_pay_rate: data.tutorPayRate,
    };

    await createRate.mutateAsync(rateData);
  };

  const handleUpdateRate = async (data: {
    studentRate: string;
    tutorPayRate: string;
  }) => {
    if (!editingRate) return;

    await updateRate.mutateAsync({
      rateId: editingRate.id,
      rateData: {
        student_rate: data.studentRate,
        tutor_pay_rate: data.tutorPayRate,
      },
    });
    setEditingRate(null);
  };

  const handleDeleteRate = async () => {
    if (!editingRate) return;
    await deleteRate.mutateAsync(editingRate.id);
    setEditingRate(null);
  };

  const getUserName = (rate: any) => {
    return userType === "student"
      ? rate.tutor_info
        ? `${rate.tutor_info.first_name} ${rate.tutor_info.last_name}`
        : "Tutor"
      : rate.student_info
      ? `${rate.student_info.first_name} ${rate.student_info.last_name}`
      : "Student";
  };

  const getTitle = () => {
    return userType === "student" ? "Tutoring Rates" : "Student Rates";
  };

  if (ratesLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading rates...</span>
        </div>
      </Card>
    );
  }

  // Compact variant (used inline in StudentsCard)
  if (variant === "compact") {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
          <AssignRateForm
            userType={userType}
            availableUsers={availableUsers}
            onSubmit={handleCreateRate}
            isSubmitting={createRate.isPending}
          />
        </div>

        {rates.length === 0 ? (
          <div className="flex items-center gap-1.5 text-red-600 text-sm py-2">
            <UserIcon size={14} />
            <span className="font-medium">
              {userType === "student"
                ? "No tutors assigned!"
                : "No students assigned!"}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {rates.map((rate: any) => {
              const name = getUserName(rate);

              return (
                <div
                  key={rate.id}
                  className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <DollarSign size={12} />
                        <span>Student: ${rate.student_rate}/hr</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <DollarSign size={12} />
                        <span>Tutor: ${rate.tutor_pay_rate}/hr</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingRate(rate)}
                    className="ml-2"
                  >
                    <Edit2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {editingRate && (
          <EditRateForm
            isOpen={true}
            onClose={() => setEditingRate(null)}
            rate={editingRate}
            userName={getUserName(editingRate)}
            onUpdate={handleUpdateRate}
            onDelete={handleDeleteRate}
            isUpdating={updateRate.isPending}
            isDeleting={deleteRate.isPending}
          />
        )}
      </Card>
    );
  }

  // Default variant (full page display)
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
        <AssignRateForm
          userType={userType}
          availableUsers={availableUsers}
          onSubmit={handleCreateRate}
          isSubmitting={createRate.isPending}
        />
      </div>

      {rates.length > 0 ? (
        <>
          <div className="space-y-2">
            {rates.map((rate: any) => {
              const name = getUserName(rate);

              return (
                <div
                  key={rate.id}
                  onClick={() => setEditingRate(rate)}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <p className="font-medium text-gray-900 mb-1">
                    {"With " + name}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600">
                      Student pays:{" "}
                      <span className="font-medium text-green-600">
                        ${rate.student_rate}/hr
                      </span>
                    </span>
                    <span className="text-gray-600">
                      Tutor gets:{" "}
                      <span className="font-medium text-blue-600">
                        ${rate.tutor_pay_rate}/hr
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {editingRate && (
            <EditRateForm
              isOpen={!!editingRate}
              onClose={() => setEditingRate(null)}
              rate={editingRate}
              userName={getUserName(editingRate)}
              onUpdate={handleUpdateRate}
              onDelete={handleDeleteRate}
              isUpdating={updateRate.isPending}
              isDeleting={deleteRate.isPending}
            />
          )}
        </>
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm">
          <p>
            {userType === "student"
              ? "No tutors assigned"
              : "No students assigned"}
          </p>
        </div>
      )}
    </Card>
  );
}
