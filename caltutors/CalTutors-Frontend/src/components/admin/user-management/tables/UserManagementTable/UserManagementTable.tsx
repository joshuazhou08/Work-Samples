"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Users, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useAdminTutors,
  useAdminClients,
} from "@/hooks/admin_management";
import { useStudents } from "@/hooks/student_management";
import { TutorsTable } from "@/components/admin/user-management/tables/TutorsTable";
import { ClientsTable } from "@/components/admin/user-management/tables/ClientsTable";
import { StudentsTable } from "@/components/admin/user-management/tables/StudentsTable";

type TabType = "tutors" | "clients" | "students";

export function UserManagementTable() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("tutors");

  // Restore active tab from URL parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as TabType | null;
    if (tabFromUrl && ["tutors", "clients", "students"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const {
    data: tutors = [],
    isLoading: tutorsLoading,
    error: tutorsError,
  } = useAdminTutors();
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
  } = useAdminClients();
  const {
    data: studentResponse,
    isLoading: studentsLoading,
    error: studentsError,
  } = useStudents();

  const students = studentResponse?.students ?? [];
  const studentsCount = studentResponse?.count ?? students.length ?? 0;

  const isLoading = tutorsLoading || clientsLoading || studentsLoading;
  const error = tutorsError || clientsError || studentsError;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Error loading users
          </h3>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage tutors, clients, and students on the platform
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("tutors")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-t-lg cursor-pointer border-b-2 ${
            activeTab === "tutors"
              ? "bg-white text-blue-600 border-blue-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 border-transparent"
          }`}
        >
          <Users size={16} />
          Tutors ({tutors?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("clients")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-t-lg cursor-pointer border-b-2 ${
            activeTab === "clients"
              ? "bg-white text-blue-600 border-blue-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 border-transparent"
          }`}
        >
          <Users size={16} />
          Clients ({clients?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-t-lg cursor-pointer border-b-2 ${
            activeTab === "students"
              ? "bg-white text-blue-600 border-blue-600"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 border-transparent"
          }`}
        >
          <Users size={16} />
          Students ({studentsCount})
        </button>
      </div>

      <div className="relative">
        <Search
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {activeTab === "tutors" && <TutorsTable searchTerm={searchTerm} />}
      {activeTab === "clients" && <ClientsTable searchTerm={searchTerm} />}
      {activeTab === "students" && <StudentsTable searchTerm={searchTerm} />}
    </div>
  );
}
