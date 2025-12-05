import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/types/auth";
import type { Student } from "@/types/students";

interface AssignRateFormProps {
  userType: "tutor" | "student";
  availableUsers: (User | Student)[];
  onSubmit: (data: {
    userId: string;
    studentRate: string;
    tutorPayRate: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function AssignRateForm({
  userType,
  availableUsers,
  onSubmit,
  isSubmitting,
}: AssignRateFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [studentRate, setStudentRate] = useState("60.00");
  const [tutorPayRate, setTutorPayRate] = useState("40.00");

  const handleSubmit = async () => {
    if (!selectedUserId) return;

    await onSubmit({
      userId: selectedUserId,
      studentRate,
      tutorPayRate,
    });

    // Reset form
    setSelectedUserId("");
    setStudentRate("60.00");
    setTutorPayRate("40.00");
    setIsOpen(false);
  };

  const getTitle = () => {
    return userType === "student" ? "Assign Tutor" : "Assign Student";
  };

  const getSelectLabel = () => {
    return userType === "student" ? "Select Tutor" : "Select Student";
  };

  const getButtonText = () => {
    return userType === "student" ? "Assign Tutor" : "Assign Student";
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus size={16} />
        {getButtonText()}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogDescription>
              {userType === "student"
                ? "Select a tutor and set rates for this assignment."
                : "Select a student and set rates for this assignment."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{getSelectLabel()}</Label>
              {availableUsers.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">
                  No available {userType === "student" ? "tutors" : "students"}{" "}
                  to assign
                </p>
              ) : (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name} {user.last_name}
                        {"client_name" in user &&
                          user.client_name &&
                          ` (Client: ${user.client_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentRate">Student Rate ($/hr)</Label>
                <Input
                  id="studentRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={studentRate}
                  onChange={(e) => setStudentRate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tutorPayRate">Tutor Pay Rate ($/hr)</Label>
                <Input
                  id="tutorPayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tutorPayRate}
                  onChange={(e) => setTutorPayRate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedUserId}
            >
              {isSubmitting ? "Creating..." : "Create Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
