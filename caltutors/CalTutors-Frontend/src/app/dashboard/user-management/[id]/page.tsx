"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAdminTutors,
  useAdminClients,
  usePatchAdminClient,
} from "@/hooks/admin_management";
import { useStudents, useStudent } from "@/hooks/student_management";
import {
  UserDetailHeader,
  PersonalInfoCard,
  StudentsCard,
  RatesCard,
} from "@/components/admin/user-management";
import { User } from "@/types/auth";
import type { Student } from "@/types/students";

type UserType = "tutor" | "client" | "student";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = parseInt(params.id as string);
  const userType = searchParams.get("type") as UserType | null;

  const [user, setUser] = useState<User | Student | null>(null);

  const { data: tutors = [], isLoading: tutorsLoading } = useAdminTutors();
  const { data: clients = [], isLoading: clientsLoading } = useAdminClients();
  const { data: studentList, isLoading: studentsLoading } = useStudents();
  const { data: student, isLoading: studentLoading } = useStudent(
    userType === "student" ? userId : 0,
    { enabled: userType === "student" }
  );

  const patchClientMutation = usePatchAdminClient();

  const students = studentList?.students ?? [];

  const isLoading =
    tutorsLoading || clientsLoading || studentsLoading || studentLoading;

  useEffect(() => {
    let foundUser: User | Student | null = null;

    if (userType === "tutor") {
      foundUser = tutors.find((t) => t.id === userId) || null;
    } else if (userType === "client") {
      foundUser = clients.find((c) => c.id === userId) || null;
    } else if (userType === "student" && student) {
      foundUser = student;
    }

    setUser(foundUser);
  }, [tutors, clients, student, userId, userType]);

  const handleBack = () => {
    const fromTab = searchParams.get("from");
    if (fromTab && ["tutors", "clients", "students"].includes(fromTab)) {
      router.push(`/dashboard/user-management?tab=${fromTab}`);
    } else {
      router.push("/dashboard/user-management");
    }
  };

  const handleSaveBalance = async (newBalance: string) => {
    if (!user || !("balance" in user)) return;

    await patchClientMutation.mutateAsync({
      clientId: userId,
      data: { balance: newBalance },
    });

    setUser({ ...user, balance: newBalance });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            User not found
          </h3>
          <p className="mt-2 text-gray-600">
            The user you're looking for doesn't exist or you don't have
            permission to view them.
          </p>
          <Button onClick={handleBack} className="mt-4">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const isStudent = "client" in user;
  const isClient = userType === "client";
  const isTutor = userType === "tutor";

  return (
    <div className="space-y-6">
      <UserDetailHeader
        firstName={user.first_name}
        lastName={user.last_name}
        userType={userType as "tutor" | "client" | "student"}
        onBack={handleBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalInfoCard
          user={user}
          userType={userType as "tutor" | "client" | "student"}
          onSaveBalance={isClient ? handleSaveBalance : undefined}
          isSaving={patchClientMutation.isPending}
        />

        {(isTutor || isStudent) && (
          <RatesCard userType={isTutor ? "tutor" : "student"} userId={userId} />
        )}

        {isClient && <StudentsCard clientId={userId} />}
      </div>
    </div>
  );
}
