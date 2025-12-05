"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/ui/general";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        <p>
          Please log in to access the dashboard.{" "}
          <Link
            href="/accounts/login"
            className="mt-2 text-blue-500 hover:text-blue-700 underline"
          >
            Go to Login
          </Link>
        </p>
      </div>
    );
  }

  const userType = user.user_type as "admin" | "tutor" | "client";

  return (
    <div className="min-h-screen">
      <Sidebar userType={userType} onCollapseChange={setIsSidebarCollapsed} />
      <main
        className={`overflow-x-hidden p-6 md:p-8 transition-all duration-300 ${
          isSidebarCollapsed ? "md:ml-20" : "md:ml-[280px]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
