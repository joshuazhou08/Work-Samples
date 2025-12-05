import React from "react";
import { BaseStepProps, PasswordStrength } from "../RegisterForm.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";

interface PasswordStepProps extends BaseStepProps {
  passwordStrength: PasswordStrength;
}

const PasswordStep = ({
  formData,
  errors,
  touched,
  isSubmitting,
  isLoading,
  onInputChange,
  passwordStrength,
}: PasswordStepProps) => {
  const getStrengthColor = (label: string) => {
    switch (label) {
      case "weak":
        return "bg-red-500";
      case "fair":
        return "bg-orange-500";
      case "good":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  const getStrengthTextColor = (label: string) => {
    switch (label) {
      case "weak":
        return "text-red-600";
      case "fair":
        return "text-orange-600";
      case "good":
        return "text-yellow-600";
      case "strong":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <>
      {/* Password */}
      <div className="mb-5">
        <Label
          htmlFor="password"
          className="text-sm font-medium text-gray-700 block mb-2"
        >
          Password
        </Label>
        <Input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={onInputChange}
          placeholder="Min 8 characters"
          className={`h-12 px-4 border rounded-lg text-[15px] transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full ${
            touched.password && errors.password
              ? "border-red-500"
              : "border-gray-200"
          }`}
          autoComplete="new-password"
          disabled={isSubmitting || isLoading}
        />
        {touched.password && errors.password && (
          <p className="text-red-600 text-xs mt-1">{errors.password}</p>
        )}

        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="mt-3">
            {/* Strength Bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${getStrengthColor(
                  passwordStrength.label
                )}`}
                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
              />
            </div>

            {passwordStrength.label && (
              <p
                className={`text-xs font-medium mb-2 ${getStrengthTextColor(
                  passwordStrength.label
                )}`}
              >
                Password strength: {passwordStrength.label}
              </p>
            )}

            {/* Requirements Checklist */}
            <div className="bg-gray-50 rounded-lg p-3 mt-2">
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  {passwordStrength.requirements.length ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <span
                    className={
                      passwordStrength.requirements.length
                        ? "text-green-700"
                        : "text-gray-600"
                    }
                  >
                    At least 8 characters
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {passwordStrength.requirements.uppercase ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <span
                    className={
                      passwordStrength.requirements.uppercase
                        ? "text-green-700"
                        : "text-gray-600"
                    }
                  >
                    One uppercase letter
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {passwordStrength.requirements.lowercase ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <span
                    className={
                      passwordStrength.requirements.lowercase
                        ? "text-green-700"
                        : "text-gray-600"
                    }
                  >
                    One lowercase letter
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {passwordStrength.requirements.number ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <span
                    className={
                      passwordStrength.requirements.number
                        ? "text-green-700"
                        : "text-gray-600"
                    }
                  >
                    One number
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {passwordStrength.requirements.special ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <span
                    className={
                      passwordStrength.requirements.special
                        ? "text-green-700"
                        : "text-gray-600"
                    }
                  >
                    One special character
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="mb-5">
        <Label
          htmlFor="password_confirm"
          className="text-sm font-medium text-gray-700 block mb-2"
        >
          Confirm Password
        </Label>
        <Input
          type="password"
          id="password_confirm"
          name="password_confirm"
          value={formData.password_confirm}
          onChange={onInputChange}
          placeholder="Re-enter your password"
          className={`h-12 px-4 border rounded-lg text-[15px] transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full ${
            touched.password_confirm && errors.password_confirm
              ? "border-red-500"
              : "border-gray-200"
          }`}
          autoComplete="new-password"
          disabled={isSubmitting || isLoading}
        />
        {touched.password_confirm && errors.password_confirm && (
          <p className="text-red-600 text-xs mt-1">{errors.password_confirm}</p>
        )}
      </div>
    </>
  );
};

export default PasswordStep;
