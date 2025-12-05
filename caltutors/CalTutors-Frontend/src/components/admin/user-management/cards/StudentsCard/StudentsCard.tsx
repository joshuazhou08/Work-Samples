"use client";

import { useState, useMemo } from "react";
import { Edit2, Mail, GraduationCap, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/student_management";
import { AddStudentForm } from "@/components/student_management/AddStudentForm";
import { EditStudentForm } from "@/components/student_management/EditStudentForm";
import { RatesCard } from "@/components/admin/user-management/cards/RatesCard";
import type { Student } from "@/types/students";

interface StudentsCardProps {
  clientId: number;
}

export function StudentsCard({ clientId }: StudentsCardProps) {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const { data: studentList, isLoading } = useStudents();

  const allStudents = studentList?.students ?? [];

  // Filter students for this specific client
  const clientStudents = useMemo(() => {
    return allStudents.filter((student) => student.client === clientId);
  }, [allStudents, clientId]);

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Students</h2>
        <p className="mt-4 text-gray-600">Loading students...</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Students ({clientStudents.length})
          </h2>
          <AddStudentForm clientId={clientId} triggerClassName="self-start" />
        </div>

        {clientStudents.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No students yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add a student to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors bg-white"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {student.first_name[0]}
                      {student.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </h3>
                      {student.grade_level && (
                        <p className="text-sm text-gray-600">
                          {student.grade_level}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-13 space-y-1">
                    {student.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <span>{student.email}</span>
                      </div>
                    )}
                    {student.subjects_studying && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen size={14} className="text-gray-400" />
                        <span>{student.subjects_studying}</span>
                      </div>
                    )}
                    {student.notes && (
                      <p className="text-sm text-gray-500 mt-2">
                        {student.notes}
                      </p>
                    )}
                  </div>

                  <RatesCard
                    userType="student"
                    userId={student.id}
                    variant="compact"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingStudent(student)}
                  className="ml-4"
                >
                  <Edit2 size={16} />
                  Edit
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editingStudent && (
        <EditStudentForm
          isOpen={true}
          onClose={() => setEditingStudent(null)}
          student={editingStudent}
        />
      )}
    </>
  );
}
