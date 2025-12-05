"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Wallet, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions } from "@/hooks/session_management";
import { StatsGrid } from "@/components/ui/general";
import { ClientStudentsSection } from "@/components/client/dashboard/ClientStudents";

export function ClientDashboard() {
  const { user } = useAuth();

  const { data: sessions = [] } = useSessions(
    user?.user_type === "client" ? { client_id: user.id } : undefined
  );

  const stats = useMemo(() => {
    if (!sessions || !user) {
      return [];
    }

    const now = Date.now();
    const upcoming = sessions.filter(
      (s) => new Date(s.start_time).getTime() > now
    );
    const uncharged = sessions.filter(
      (s) => !s.student_charged && new Date(s.end_time).getTime() <= now
    );

    return [
      {
        title: "Account Credits",
        value: parseFloat(user.balance || "0"),
        icon: Wallet,
        color: "green",
        change: "",
      },
      {
        title: "Sessions to Review",
        value: uncharged.length,
        icon: DollarSign,
        color: "orange",
        change: "",
      },
      {
        title: "Upcoming Sessions",
        value: upcoming.length,
        icon: Calendar,
        color: "blue",
        change: "",
      },
      {
        title: "Total Sessions",
        value: sessions.length,
        icon: CheckCircle,
        color: "purple",
        change: "",
      },
    ];
  }, [sessions, user]);

  if (!user) {
    return null;
  }

  return (
    <div>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.first_name}!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your tutoring sessions and schedule.
            {user.balance && parseFloat(user.balance) > 0 && (
              <span className="text-green-600 font-medium ml-2">
                You have ${parseFloat(user.balance).toFixed(2)} in account
                credits.
              </span>
            )}
          </p>
        </div>

        <StatsGrid stats={stats} isLoading={false} />

        <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 px-6 py-4 text-blue-900">
          <p className="text-lg font-semibold">
            Need a tutor?{" "}
            <Link
              href="https://calendly.com/caltutorsteam/30min"
              className="text-blue-700 underline underline-offset-2 hover:text-blue-900"
            >
              Schedule a consultation
            </Link>
          </p>
        </div>
      </div>

      <ClientStudentsSection />

    </div>
  );
}
