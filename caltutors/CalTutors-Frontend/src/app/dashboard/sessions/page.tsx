"use client";

import { useState } from "react";
import { SessionsTab } from "@/components/admin/sessions";
import DateRangeSelector, {
  usePersistentDateRange,
} from "@/components/ui/general/DateRangeSelector";
import { useSessionStats } from "@/hooks/admin_management";

export default function SessionsPage() {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    preset,
    setPreset,
    currentMonth,
  } = usePersistentDateRange("sessions");

  const [isLoading] = useState(false);
  const {
    data: sessionStats,
    isLoading: statsLoading,
    error: statsError,
  } = useSessionStats(startDate, endDate);

  const handleRefresh = () => {
    // TODO: Implement refresh logic when connected to API
    console.log("Refreshing sessions data...");
  };

  const getDateRangeLabel = () => {
    if (!startDate && !endDate) return "All Time";
    if (startDate === currentMonth.start && endDate === currentMonth.end) {
      return new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(
        endDate
      ).toLocaleDateString()}`;
    }
    return "Custom Range";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sessions Overview</h1>
        <p className="mt-2 text-gray-600">Sessions for {getDateRangeLabel()}</p>
      </div>
      {/* Date Range Selector */}
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        preset={preset}
        onPresetChange={setPreset}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Sessions Tab Content */}
      <SessionsTab
        sessionStats={sessionStats}
        isLoading={isLoading || statsLoading}
        error={statsError}
      />
    </div>
  );
}
