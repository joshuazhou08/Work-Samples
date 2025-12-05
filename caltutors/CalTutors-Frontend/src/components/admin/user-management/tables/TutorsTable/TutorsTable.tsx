"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FilterableDataTable } from "@/components/ui/dashboard";
import { useAdminTutors } from "@/hooks/admin_management";
import { tutorColumns } from "../columns";
import { FilterOption, CSVHeader } from "@/components/ui/general";
import { AdminUser } from "@/types/admin_management";

interface TutorsTableProps {
  searchTerm: string;
}

const tutorCsvHeaders: CSVHeader<AdminUser>[] = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "username", label: "Username" },
  {
    key: "subjects_taught",
    label: "Subjects",
  },
  {
    key: "is_recently_active",
    label: "Recently Active",
    accessor: (tutor) => (tutor.is_recently_active ? "Yes" : "No"),
  },
  {
    key: "notices",
    label: "Notices",
    accessor: (tutor) => (tutor.notices || []).join(", "),
  },
  {
    key: "hasActiveStudents",
    label: "Has Active Students",
    accessor: (tutor) =>
      tutor.hasActiveStudents === undefined
        ? ""
        : tutor.hasActiveStudents
        ? "Yes"
        : "No",
  },
  {
    key: "date_joined",
    label: "Date Joined",
    accessor: (tutor) =>
      tutor.date_joined
        ? new Date(tutor.date_joined).toLocaleDateString()
        : "",
  },
];

export function TutorsTable({ searchTerm }: TutorsTableProps) {
  const router = useRouter();
  const [showOnlyNoStudents, setShowOnlyNoStudents] = useState(false);
  const [showOnlyInvalidBilling, setShowOnlyInvalidBilling] = useState(false);
  const [showOnlyRecentlyActive, setShowOnlyRecentlyActive] = useState(false);

  const { data: tutors = [], isLoading, error } = useAdminTutors();

  const filteredTutors = useMemo(() => {
    if (!tutors || !Array.isArray(tutors)) return [];
    const searchLower = searchTerm.toLowerCase();

    let filtered = tutors.filter(
      (tutor) =>
        tutor.first_name.toLowerCase().includes(searchLower) ||
        tutor.last_name.toLowerCase().includes(searchLower) ||
        tutor.email.toLowerCase().includes(searchLower) ||
        (tutor.subjects_taught &&
          tutor.subjects_taught.toLowerCase().includes(searchLower))
    );

    // Apply "no students" filter using backend-computed field
    if (showOnlyNoStudents) {
      filtered = filtered.filter((tutor) => !tutor.hasActiveStudents);
    }
    if (showOnlyInvalidBilling) {
      filtered = filtered.filter(
        (tutor) =>
          tutor.billing_status === "invalid" || tutor.billing_status === "missing"
      );
    }
    if (showOnlyRecentlyActive) {
      filtered = filtered.filter((tutor) => tutor.is_recently_active);
    }

    return filtered;
  }, [
    tutors,
    searchTerm,
    showOnlyNoStudents,
    showOnlyInvalidBilling,
    showOnlyRecentlyActive,
  ]);

  const handleTutorClick = (tutor: AdminUser) => {
    router.push(
      `/dashboard/user-management/${tutor.id}?type=tutor&from=tutors`
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
      id: "recently-active",
      label: "Show only recently active",
      checked: showOnlyRecentlyActive,
    },
    {
      id: "no-students",
      label: "Show only tutors with no students",
      checked: showOnlyNoStudents,
    },
    {
      id: "invalid-billing",
      label: "Show only tutors with invalid billing",
      checked: showOnlyInvalidBilling,
    },
  ];

  const handleFilterChange = (optionId: string, checked: boolean) => {
    if (optionId === "no-students") {
      setShowOnlyNoStudents(checked);
    } else if (optionId === "invalid-billing") {
      setShowOnlyInvalidBilling(checked);
    } else if (optionId === "recently-active") {
      setShowOnlyRecentlyActive(checked);
    }
  };

  const handleFilterReset = () => {
    setShowOnlyNoStudents(false);
    setShowOnlyInvalidBilling(false);
    setShowOnlyRecentlyActive(false);
  };

  return (
    <FilterableDataTable
      columns={tutorColumns}
      data={filteredTutors}
      onRowClick={handleTutorClick}
      filterOptions={filterOptions}
      onFilterChange={handleFilterChange}
      onFilterReset={handleFilterReset}
      exportToCSV
      csvFileName="tutors.csv"
      csvHeaders={tutorCsvHeaders}
    />
  );
}
