import { useState } from "react";
import { Edit3, Save, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "@/types/auth";
import type { Student } from "@/types/students";

interface PersonalInfoCardProps {
  user: User | Student;
  userType: "tutor" | "client" | "student";
  onSaveBalance?: (newBalance: string) => Promise<void>;
  isSaving?: boolean;
}

export function PersonalInfoCard({
  user,
  userType,
  onSaveBalance,
  isSaving = false,
}: PersonalInfoCardProps) {
  const isStudent = "client" in user;
  const isTutor = userType === "tutor";
  const isClient = userType === "client";

  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editedBalance, setEditedBalance] = useState(
    "balance" in user ? user.balance || "0.00" : "0.00"
  );

  const handleEditBalance = () => {
    if ("balance" in user) {
      setEditedBalance(user.balance || "0.00");
      setIsEditingBalance(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingBalance(false);
    if ("balance" in user) {
      setEditedBalance(user.balance || "0.00");
    }
  };

  const handleSaveBalance = async () => {
    const numericBalance = parseFloat(editedBalance);
    if (isNaN(numericBalance) || numericBalance < 0) {
      alert("Please enter a valid balance (0 or greater)");
      return;
    }

    if (onSaveBalance) {
      await onSaveBalance(editedBalance);
      setIsEditingBalance(false);
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Personal Information
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label className="text-sm font-medium text-gray-600">Name</Label>
          <p className="mt-1 text-base text-gray-900">
            {user.first_name} {user.last_name}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Email</Label>
          <p className="mt-1 text-base text-gray-900">{user.email || "N/A"}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">
            Phone Number
          </Label>
          <p className="mt-1 text-base text-gray-900">
            {user.phone_number || "N/A"}
          </p>
        </div>
        {"username" in user && (
          <div>
            <Label className="text-sm font-medium text-gray-600">
              Username
            </Label>
            <p className="mt-1 text-base text-gray-900">@{user.username}</p>
          </div>
        )}
        {isTutor && "subjects_taught" in user && (
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-600">
              Subjects Taught
            </Label>
            <p className="mt-1 text-base text-gray-900">
              {user.subjects_taught || "No subjects"}
            </p>
          </div>
        )}
        {isStudent && (
          <>
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Grade Level
              </Label>
              <p className="mt-1 text-base text-gray-900">
                {user.grade_level || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Client
              </Label>
              <p className="mt-1 text-base text-gray-900">
                {user.client_name || `ID: ${user.client}`}
              </p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-600">
                Subjects Studying
              </Label>
              <p className="mt-1 text-base text-gray-900">
                {user.subjects_studying || "N/A"}
              </p>
            </div>
            {user.notes && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-600">
                  Notes
                </Label>
                <p className="mt-1 text-base text-gray-900">{user.notes}</p>
              </div>
            )}
          </>
        )}
        {isClient && "balance" in user && (
          <div className="md:col-span-2 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-600">
                Account Balance
              </Label>
              {!isEditingBalance && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditBalance}
                  className="h-8 gap-1 hover:bg-gray-100"
                >
                  <Edit3 size={14} />
                  Edit
                </Button>
              )}
            </div>
            {isEditingBalance ? (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedBalance}
                    onChange={(e) => setEditedBalance(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  onClick={handleSaveBalance}
                  disabled={isSaving}
                  size="sm"
                  className="h-9 gap-1"
                >
                  <Save size={14} />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancelEdit}
                  size="sm"
                  className="h-9 gap-1"
                >
                  <X size={14} />
                  Cancel
                </Button>
              </div>
            ) : (
              <p className="text-xl font-semibold text-green-600">
                ${user.balance || "0.00"}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
