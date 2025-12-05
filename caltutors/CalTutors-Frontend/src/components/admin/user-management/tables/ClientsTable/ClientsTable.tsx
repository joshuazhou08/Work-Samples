"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FilterableDataTable } from "@/components/ui/dashboard";
import { useAdminClients } from "@/hooks/admin_management";
import { clientColumns } from "../columns";
import { FilterOption, CSVHeader } from "@/components/ui/general";
import { AdminUser } from "@/types/admin_management";

interface ClientsTableProps {
  searchTerm: string;
}

const clientCsvHeaders: CSVHeader<AdminUser>[] = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "username", label: "Username" },
  {
    key: "balance",
    label: "Credits",
    accessor: (client) =>
      typeof client.balance === "number" || typeof client.balance === "string"
        ? client.balance
        : "",
  },
  {
    key: "is_recently_active",
    label: "Recently Active",
    accessor: (client) => (client.is_recently_active ? "Yes" : "No"),
  },
  {
    key: "notices",
    label: "Notices",
    accessor: (client) => (client.notices || []).join(", "),
  },
  {
    key: "hasStudents",
    label: "Has Students",
    accessor: (client) =>
      client.hasStudents === undefined
        ? ""
        : client.hasStudents
        ? "Yes"
        : "No",
  },
  {
    key: "date_joined",
    label: "Date Joined",
    accessor: (client) =>
      client.date_joined
        ? new Date(client.date_joined).toLocaleDateString()
        : "",
  },
];

export function ClientsTable({ searchTerm }: ClientsTableProps) {
  const router = useRouter();
  const [showOnlyNoStudents, setShowOnlyNoStudents] = useState(false);
  const [showOnlyInvalidBilling, setShowOnlyInvalidBilling] = useState(false);
  const [showOnlyRecentlyActive, setShowOnlyRecentlyActive] = useState(false);

  const { data: clients = [], isLoading, error } = useAdminClients();

  const filteredClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];
    const searchLower = searchTerm.toLowerCase();

    let filtered = clients.filter(
      (client) =>
        client.first_name.toLowerCase().includes(searchLower) ||
        client.last_name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower)
    );

    // Apply "no students" filter using backend-computed field
    if (showOnlyNoStudents) {
      filtered = filtered.filter((client) => !client.hasStudents);
    }
    if (showOnlyInvalidBilling) {
      filtered = filtered.filter(
        (client) =>
          client.billing_status === "invalid" ||
          client.billing_status === "missing"
      );
    }
    if (showOnlyRecentlyActive) {
      filtered = filtered.filter((client) => client.is_recently_active);
    }

    return filtered;
  }, [
    clients,
    searchTerm,
    showOnlyNoStudents,
    showOnlyInvalidBilling,
    showOnlyRecentlyActive,
  ]);

  const handleClientClick = (client: AdminUser) => {
    router.push(
      `/dashboard/user-management/${client.id}?type=client&from=clients`
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
      label: "Show only clients with no students",
      checked: showOnlyNoStudents,
    },
    {
      id: "invalid-billing",
      label: "Show only clients with invalid billing",
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
      columns={clientColumns}
      data={filteredClients}
      onRowClick={handleClientClick}
      filterOptions={filterOptions}
      onFilterChange={handleFilterChange}
      onFilterReset={handleFilterReset}
      exportToCSV
      csvFileName="clients.csv"
      csvHeaders={clientCsvHeaders}
    />
  );
}
