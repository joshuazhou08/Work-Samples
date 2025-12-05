import { ArrowLeft, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserDetailHeaderProps {
  firstName: string;
  lastName: string;
  userType: "tutor" | "client" | "student";
  onBack: () => void;
}

export function UserDetailHeader({
  firstName,
  lastName,
  userType,
  onBack,
}: UserDetailHeaderProps) {
  const userTypeLabel =
    userType === "tutor"
      ? "Tutor"
      : userType === "client"
      ? "Client"
      : "Student";

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft size={20} />
        Back to Users
      </Button>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <UserIcon size={32} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {firstName} {lastName}
          </h1>
          <p className="text-gray-600">{userTypeLabel}</p>
        </div>
      </div>
    </div>
  );
}
