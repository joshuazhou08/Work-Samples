import React from "react";
import { BaseStepProps } from "../RegisterForm.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserTypeStepProps extends BaseStepProps {
  onUserTypeChange: (userType: "client" | "tutor") => void;
}

const UserTypeStep = ({
  formData,
  errors,
  touched,
  isSubmitting,
  isLoading,
  onInputChange,
  onUserTypeChange,
}: UserTypeStepProps) => {
  return (
    <>
      {/* User Type Selection */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-3">
          I am a:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label
            htmlFor="client"
            className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-blue-300 ${
              formData.user_type === "client"
                ? "border-blue-600 bg-blue-50/50"
                : "border-gray-200 bg-white"
            }`}
          >
            <input
              type="radio"
              id="client"
              name="user_type"
              value="client"
              checked={formData.user_type === "client"}
              onChange={() => onUserTypeChange("client")}
              className="sr-only"
            />
            <div className="text-4xl mb-2">🎓</div>
            <div className="text-base font-semibold text-gray-900 mb-1">
              Client
            </div>
            <div className="text-xs text-gray-500 text-center">
              Looking for tutoring help
            </div>
          </label>

          <label
            htmlFor="tutor"
            className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-blue-300 ${
              formData.user_type === "tutor"
                ? "border-blue-600 bg-blue-50/50"
                : "border-gray-200 bg-white"
            }`}
          >
            <input
              type="radio"
              id="tutor"
              name="user_type"
              value="tutor"
              checked={formData.user_type === "tutor"}
              onChange={() => onUserTypeChange("tutor")}
              className="sr-only"
            />
            <div className="text-4xl mb-2">👨‍🏫</div>
            <div className="text-base font-semibold text-gray-900 mb-1">
              Tutor
            </div>
            <div className="text-xs text-gray-500 text-center">
              Ready to help clients learn
            </div>
          </label>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <Label
            htmlFor="first_name"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            First Name
          </Label>
          <Input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={onInputChange}
            placeholder="John"
            className={`h-12 px-4 border rounded-lg text-[15px] transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full ${
              touched.first_name && errors.first_name
                ? "border-red-500"
                : "border-gray-200"
            }`}
            disabled={isSubmitting || isLoading}
          />
          {touched.first_name && errors.first_name && (
            <p className="text-red-600 text-xs mt-1">{errors.first_name}</p>
          )}
        </div>

        <div>
          <Label
            htmlFor="last_name"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Last Name
          </Label>
          <Input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={onInputChange}
            placeholder="Doe"
            className={`h-12 px-4 border rounded-lg text-[15px] transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full ${
              touched.last_name && errors.last_name
                ? "border-red-500"
                : "border-gray-200"
            }`}
            disabled={isSubmitting || isLoading}
          />
          {touched.last_name && errors.last_name && (
            <p className="text-red-600 text-xs mt-1">{errors.last_name}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default UserTypeStep;
