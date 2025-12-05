"use client";

import { useState, useMemo } from "react";
import { Calendar, Loader2, AlertCircle, Search } from "lucide-react";
import { useAdminCharges } from "@/hooks/admin_management";
import { Input } from "@/components/ui/input";
import { ChargesList } from "./lists";

interface ChargesTabProps {
  startDate: string;
  endDate: string;
}

export function ChargesTab({ startDate, endDate }: ChargesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCharges, setExpandedCharges] = useState<Set<number>>(
    new Set()
  );

  // Fetch charges with backend filtering
  const {
    data: charges = [],
    isLoading,
    error,
  } = useAdminCharges({
    start_date: startDate,
    end_date: endDate,
  });

  const toggleChargeExpansion = (chargeId: number) => {
    const newExpanded = new Set(expandedCharges);
    if (newExpanded.has(chargeId)) {
      newExpanded.delete(chargeId);
    } else {
      newExpanded.add(chargeId);
    }
    setExpandedCharges(newExpanded);
  };

  // Filter charges by search term only (date filtering is done on backend)
  const filteredCharges = useMemo(() => {
    let filtered = charges;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((charge) => {
        const clientName =
          `${charge.user_info.first_name} ${charge.user_info.last_name}`.toLowerCase();
        const email = charge.user_info.email.toLowerCase();

        // Also search in session details for student names
        const hasMatchingStudent = charge.session_details.some((session) =>
          session.student_name.toLowerCase().includes(searchLower)
        );

        return (
          clientName.includes(searchLower) ||
          email.includes(searchLower) ||
          hasMatchingStudent
        );
      });
    }

    return filtered;
  }, [charges, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      {!isLoading && !error && charges.length > 0 && (
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Search by client or student name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading charges...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error loading charges</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
        </div>
      )}

      {/* Empty State - No charges */}
      {!isLoading && !error && charges.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No charges found</p>
        </div>
      )}

      {/* Empty State - No search results */}
      {!isLoading &&
        !error &&
        charges.length > 0 &&
        filteredCharges.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No charges found matching &quot;{searchTerm}&quot;</p>
          </div>
        )}

      {/* Charges List */}
      {!isLoading && !error && filteredCharges.length > 0 && (
        <ChargesList
          charges={filteredCharges}
          expandedCharges={expandedCharges}
          onToggleCharge={toggleChargeExpansion}
        />
      )}
    </div>
  );
}
