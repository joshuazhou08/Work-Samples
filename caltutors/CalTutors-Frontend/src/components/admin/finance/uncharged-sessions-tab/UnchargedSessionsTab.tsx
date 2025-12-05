"use client";

import { useState, useMemo } from "react";
import { Calendar, Loader2, AlertCircle, Search } from "lucide-react";
import { useUnchargedSessions } from "@/hooks/admin_management";
import { Input } from "@/components/ui/input";
import {
  CSVExportButton,
  CSVHeader,
} from "@/components/ui/general/CSVExportButton";
import { UnchargedSessionsList } from "./lists/UnchargedSessionsList";

interface ClientCSVRow {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
}

const CLIENT_HEADERS: CSVHeader<ClientCSVRow>[] = [
  { key: "clientName", label: "Client Name" },
  { key: "clientEmail", label: "Client Email" },
  { key: "clientPhone", label: "Client Phone Number" },
];

export function UnchargedSessionsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(
    new Set()
  );

  // Fetch all uncharged sessions
  const {
    data: unchargedGroups = [],
    isLoading,
    error,
    refetch,
  } = useUnchargedSessions();

  const toggleStudentExpansion = (studentId: number) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // Filter sessions based on search term (client-side)
  const filteredGroups = useMemo(() => {
    let filtered = unchargedGroups;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((group) => {
        const studentName =
          `${group.student.first_name} ${group.student.last_name}`.toLowerCase();
        const clientName =
          `${group.client.first_name} ${group.client.last_name}`.toLowerCase();
        const studentEmail = group.student.email.toLowerCase();
        const clientEmail = group.client.email.toLowerCase();

        return (
          studentName.includes(searchLower) ||
          clientName.includes(searchLower) ||
          studentEmail.includes(searchLower) ||
          clientEmail.includes(searchLower)
        );
      });
    }

    return filtered;
  }, [unchargedGroups, searchTerm]);

  const totalSessions = useMemo(() => {
    return filteredGroups.reduce(
      (sum, group) => sum + group.sessions.length,
      0
    );
  }, [filteredGroups]);

  const csvData = useMemo<ClientCSVRow[]>(() => {
    const seenClients = new Set<number>();
    return filteredGroups.reduce<ClientCSVRow[]>((rows, group) => {
      if (!seenClients.has(group.client.id)) {
        seenClients.add(group.client.id);
        rows.push({
          clientName: `${group.client.first_name} ${group.client.last_name}`,
          clientEmail: group.client.email,
          clientPhone: group.client.phone_number || "",
        });
      }
      return rows;
    }, []);
  }, [filteredGroups]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      {!isLoading && !error && unchargedGroups.length > 0 && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Search by student name, client name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <CSVExportButton
            data={csvData}
            headers={CLIENT_HEADERS}
            fileName="uncharged-clients.csv"
            className="w-full md:w-auto"
            disabledText="No clients to export"
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading uncharged sessions...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">
              Error loading uncharged sessions
            </p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && unchargedGroups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No uncharged sessions found</p>
          <p className="text-sm mt-1">All sessions have been charged</p>
        </div>
      )}

      {/* Empty State - No search results */}
      {!isLoading &&
        !error &&
        unchargedGroups.length > 0 &&
        filteredGroups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No students found matching &quot;{searchTerm}&quot;</p>
          </div>
        )}

      {/* Uncharged Sessions List */}
      {!isLoading && !error && filteredGroups.length > 0 && (
        <UnchargedSessionsList
          groups={filteredGroups}
          expandedStudents={expandedStudents}
          onToggleStudent={toggleStudentExpansion}
        />
      )}
    </div>
  );
}
