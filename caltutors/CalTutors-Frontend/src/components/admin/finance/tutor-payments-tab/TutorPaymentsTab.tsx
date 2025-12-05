"use client";

import { useState, useMemo } from "react";
import { Calendar, Loader2, AlertCircle, Search } from "lucide-react";
import { useTutorPayments } from "@/hooks/admin_management";
import { Input } from "@/components/ui/input";
import { TutorPaymentsList } from "./lists";
import type { TutorPayment } from "@/types/admin_management";

interface TutorPaymentsTabProps {
  startDate: string;
  endDate: string;
}

export function TutorPaymentsTab({
  startDate,
  endDate,
}: TutorPaymentsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTutors, setExpandedTutors] = useState<Set<number>>(new Set());

  // Fetch tutor payments with backend filtering
  const {
    data: allTutorPayments = [],
    isLoading,
    error,
  } = useTutorPayments(startDate, endDate);

  const toggleTutorExpansion = (tutorId: number) => {
    const newExpanded = new Set(expandedTutors);
    if (newExpanded.has(tutorId)) {
      newExpanded.delete(tutorId);
    } else {
      newExpanded.add(tutorId);
    }
    setExpandedTutors(newExpanded);
  };

  // Filter tutor payments by search term only (date filtering is done on backend)
  const filteredTutorPayments = useMemo(() => {
    let filtered = allTutorPayments;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((payment: TutorPayment) => {
        const fullName =
          `${payment.tutor.first_name} ${payment.tutor.last_name}`.toLowerCase();
        const email = payment.tutor.email.toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
      });
    }

    return filtered;
  }, [allTutorPayments, searchTerm]);

  const totalOwed = useMemo(() => {
    return filteredTutorPayments.reduce(
      (sum: number, payment: TutorPayment) =>
        sum + parseFloat(payment.total_amount),
      0
    );
  }, [filteredTutorPayments]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      {!isLoading && !error && allTutorPayments.length > 0 && (
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Search tutors by name or email..."
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
            <p className="text-gray-600">Loading tutor payments...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">
              Error loading tutor payments
            </p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
        </div>
      )}

      {/* Empty State - No sessions in date range */}
      {!isLoading && !error && allTutorPayments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No tutor payments data available</p>
        </div>
      )}

      {/* Empty State - No sessions in filtered date range */}
      {!isLoading &&
        !error &&
        allTutorPayments.length > 0 &&
        filteredTutorPayments.length === 0 &&
        !searchTerm && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No sessions found for the selected date range</p>
          </div>
        )}

      {/* Empty State - No search results */}
      {!isLoading &&
        !error &&
        allTutorPayments.length > 0 &&
        filteredTutorPayments.length === 0 &&
        searchTerm && (
          <div className="text-center py-12 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tutors found matching &quot;{searchTerm}&quot;</p>
          </div>
        )}

      {/* Tutor Payments List */}
      {!isLoading && !error && filteredTutorPayments.length > 0 && (
        <TutorPaymentsList
          tutorPayments={filteredTutorPayments}
          expandedTutors={expandedTutors}
          onToggleTutor={toggleTutorExpansion}
        />
      )}
    </div>
  );
}
