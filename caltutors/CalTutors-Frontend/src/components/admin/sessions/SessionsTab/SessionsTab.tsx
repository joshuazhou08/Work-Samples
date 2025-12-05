"use client";

import { useMemo } from "react";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { StatsGrid } from "@/components/ui/general";
import { TutorPerformanceTable } from "../tables";
import type { SessionStats } from "@/types/admin_management";

interface SessionsTabProps {
  isLoading?: boolean;
  sessionStats?: SessionStats;
  error?: unknown;
}

export default function SessionsTab({
  isLoading = false,
  sessionStats,
  error,
}: SessionsTabProps) {
  const displayData = useMemo(() => {
    if (!sessionStats) {
      return {
        stats: [],
        tutorStats: {
          topTutors: [],
          bottomTutors: [],
        },
      };
    }

    const stats = [
      {
        title: "Total Sessions",
        value: sessionStats.total_sessions,
        icon: Calendar,
        color: "blue",
        change: "",
      },
      {
        title: "Completed",
        value: sessionStats.completed_sessions,
        icon: CheckCircle,
        color: "green",
        change: "",
      },
      {
        title: "Upcoming",
        value: sessionStats.upcoming_sessions,
        icon: Clock,
        color: "orange",
        change: "",
      },
      {
        title: "Total Hours",
        value: parseFloat(sessionStats.total_hours),
        icon: Users,
        color: "purple",
        change: "",
      },
    ];

    return {
      stats,
      tutorStats: {
        topTutors: sessionStats.top_tutors.map((t) => ({
          info: t.tutor,
          count: t.session_count,
        })),
        bottomTutors: sessionStats.bottom_tutors.map((t) => ({
          info: t.tutor,
          count: t.session_count,
        })),
      },
    };
  }, [sessionStats]);

  // Show error state if API call fails
  if (error && !sessionStats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-900 font-medium">Error loading session stats</p>
        <p className="text-red-700 text-sm mt-1">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsGrid stats={displayData.stats} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TutorPerformanceTable
          tutors={displayData.tutorStats.topTutors}
          title="Most Active Tutors"
          isLoading={isLoading}
          emptyMessage="No tutor data available for this period"
        />
        <TutorPerformanceTable
          tutors={displayData.tutorStats.bottomTutors}
          title="Least Active Tutors"
          isLoading={isLoading}
          emptyMessage="No tutor data available for this period"
        />
      </div>
    </div>
  );
}
