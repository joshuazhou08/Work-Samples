"use client";

import { useState } from "react";
import {
  Edit,
  GraduationCap,
  Mail,
  Phone,
  StickyNote,
  BookOpen,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddStudentForm, EditStudentForm } from "@/components/student_management";
import { useStudents } from "@/hooks/student_management";
import type { Student } from "@/types/students";

export function ClientStudentsSection() {
  const {
    data: studentsResponse,
    isLoading,
    error,
  } = useStudents();

  const students = studentsResponse?.students ?? [];

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const openEditForm = (student: Student) => {
    setEditingStudent(student);
  };

  const closeEditForm = () => {
    setEditingStudent(null);
  };

  return (
    <section className="px-6 pb-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wide">
              <Users size={16} />
              <span>Students</span>
            </div>
            <h2 className="mt-1 text-2xl font-semibold text-gray-900">
              Manage your learners
            </h2>
            <p className="text-sm text-gray-600">
              Keep student details up to date so tutors have everything they
              need.
            </p>
          </div>

          <AddStudentForm triggerClassName="self-start sm:self-auto" />
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span>Loading students...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Unable to load students. Please try again later.
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
              <p className="font-medium text-gray-800">
                No students added yet
              </p>
              <p className="mt-2">
                Click &quot;Add Student&quot; to create a student profile for your
                learner.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {students.map((student) => (
                <article
                  key={student.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.first_name} {student.last_name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <GraduationCap size={16} />
                        <span>
                          {student.grade_level
                            ? student.grade_level
                            : "Grade not specified"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(student)}
                      className="gap-1.5"
                    >
                      <Edit size={16} />
                      Edit
                    </Button>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm text-gray-600">
                    {student.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span>{student.email}</span>
                      </div>
                    )}

                    {student.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <span>{student.phone_number}</span>
                      </div>
                    )}

                    {student.subjects_studying && (
                      <div className="flex items-start gap-2">
                        <BookOpen size={16} className="mt-0.5 text-gray-400" />
                        <span>{student.subjects_studying}</span>
                      </div>
                    )}

                    {student.notes && (
                      <div className="flex items-start gap-2">
                        <StickyNote
                          size={16}
                          className="mt-0.5 text-gray-400"
                        />
                        <span className="whitespace-pre-line">
                          {student.notes}
                        </span>
                      </div>
                    )}
                  </dl>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingStudent && (
        <EditStudentForm
          isOpen={Boolean(editingStudent)}
          student={editingStudent}
          onClose={closeEditForm}
        />
      )}
    </section>
  );
}
