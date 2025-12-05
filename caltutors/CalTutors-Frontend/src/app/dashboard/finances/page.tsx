"use client";

import { useMemo, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  FileWarning,
  Users,
} from "lucide-react";
import {
  TutorPaymentsTab,
  ChargesTab,
  UnchargedSessionsTab,
} from "@/components/admin/finance";
import { useFinanceStats } from "@/hooks/admin_management";
import DateRangeSelector, {
  usePersistentDateRange,
} from "@/components/ui/general/DateRangeSelector";
import { StatsGrid } from "@/components/ui/general";

type TabType = "tutor-payments" | "charges" | "uncharged";

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("tutor-payments");

  const { startDate, setStartDate, endDate, setEndDate, preset, setPreset } =
    usePersistentDateRange("finances");

  // Fetch finance stats
  const {
    data: financeStats,
    isLoading: statsLoading,
    refetch,
  } = useFinanceStats(startDate, endDate);

  const stats = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: financeStats ? parseFloat(financeStats.total_revenue) : 0,
        icon: DollarSign,
        color: "green",
        change: "",
      },
      {
        title: "Tutor Payments",
        value: financeStats ? parseFloat(financeStats.total_tutor_payments) : 0,
        icon: Receipt,
        color: "blue",
        change: "",
      },
      {
        title: "Platform Revenue",
        value: financeStats ? parseFloat(financeStats.platform_revenue) : 0,
        icon: TrendingUp,
        color: "purple",
        change: "",
      },
      {
        title: "Uncharged Sessions",
        value: financeStats ? financeStats.uncharged_sessions_count : 0,
        icon: FileWarning,
        color: "orange",
        change: "",
      },
    ],
    [financeStats]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Management</h1>
        <p className="mt-2 text-gray-600">
          Track tutor payments, revenue, and financial analytics
        </p>
      </div>

      {/* Date Range for Stats */}
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        preset={preset}
        onPresetChange={setPreset}
        onRefresh={refetch}
        isLoading={statsLoading}
      />

      <StatsGrid stats={stats} isLoading={statsLoading} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("tutor-payments")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-t-lg cursor-pointer border-b-2 ${
            activeTab === "tutor-payments"
              ? "bg-white text-blue-600 border-blue-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 border-transparent"
          }`}
        >
          <Users size={16} />
          Tutor Payments
        </button>
        <button
          onClick={() => setActiveTab("charges")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-t-lg cursor-pointer border-b-2 ${
            activeTab === "charges"
              ? "bg-white text-blue-600 border-blue-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 border-transparent"
          }`}
        >
          <Receipt size={16} />
          Charges
        </button>
        <button
          onClick={() => setActiveTab("uncharged")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-t-lg cursor-pointer border-b-2 ${
            activeTab === "uncharged"
              ? "bg-white text-blue-600 border-blue-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 border-transparent"
          }`}
        >
          <FileWarning size={16} />
          Uncharged Sessions
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === "tutor-payments" && (
          <TutorPaymentsTab startDate={startDate} endDate={endDate} />
        )}
        {activeTab === "charges" && (
          <ChargesTab startDate={startDate} endDate={endDate} />
        )}
        {activeTab === "uncharged" && <UnchargedSessionsTab />}
      </div>
    </div>
  );
}
