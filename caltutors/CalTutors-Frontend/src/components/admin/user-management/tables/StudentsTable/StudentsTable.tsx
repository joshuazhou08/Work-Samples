"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FilterableDataTable } from "@/components/ui/dashboard";
import { useStudents } from "@/hooks/student_management";
import { studentColumns } from "../columns";
import { FilterOption, CSVHeader } from "@/components/ui/general";
import type { Student } from "@/types/students";

interface StudentsTableProps {
  searchTerm: string;
}

const studentCsvHeaders: CSVHeader<Student>[] = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "client_name", label: "Client Name" },
  { key: "grade_level", label: "Grade" },
  {
    key: "hasTutors",
    label: "Has Tutors",
    accessor: (student) =>
      student.hasTutors === undefined
        ? ""
        : student.hasTutors
        ? "Yes"
        : "No",
  },
  {
    key: "created_at",
    label: "Created",
    accessor: (student) =>
      student.created_at
        ? new Date(student.created_at).toLocaleDateString()
        : "",
  },
];

export function StudentsTable({ searchTerm }: StudentsTableProps) {
  const router = useRouter();
  const [showOnlyNoTutors, setShowOnlyNoTutors] = useState(false);

  const {
    data: studentList,
    isLoading,
    error,
  } = useStudents();
  const students = studentList?.students ?? [];

  const filteredStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    const searchLower = searchTerm.toLowerCase();

    let filtered = students.filter(
      (student) =>
        student.first_name.toLowerCase().includes(searchLower) ||
        student.last_name.toLowerCase().includes(searchLower) ||
        (student.email && student.email.toLowerCase().includes(searchLower)) ||
        (student.client_name &&
          student.client_name.toLowerCase().includes(searchLower))
    );

    // Apply "no tutors" filter using backend-computed field
    if (showOnlyNoTutors) {
      filtered = filtered.filter((student) => !student.hasTutors);
    }

    return filtered;
  }, [students, searchTerm, showOnlyNoTutors]);

  const handleStudentClick = (student: Student) => {
    router.push(
      `/dashboard/user-management/${student.id}?type=student&from=students`
    );
  };

  if (isLoading) {
    return null; // Loading handled by parent
  }

  if (error) {
    return null; // Error handled by parent
  }

  const filterOptions: FilterOption[] = [
    {
      id: "no-tutors",
      label: "Show only students with no tutors",
      checked: showOnlyNoTutors,
    },
  ];

  const handleFilterChange = (optionId: string, checked: boolean) => {
    if (optionId === "no-tutors") {
      setShowOnlyNoTutors(checked);
    }
  };

  const handleFilterReset = () => {
    setShowOnlyNoTutors(false);
  };

  return (
    <FilterableDataTable
      columns={studentColumns}
      data={filteredStudents}
      onRowClick={handleStudentClick}
      filterOptions={filterOptions}
      onFilterChange={handleFilterChange}
      onFilterReset={handleFilterReset}
      exportToCSV
      csvFileName="students.csv"
      csvHeaders={studentCsvHeaders}
    />
  );
}
