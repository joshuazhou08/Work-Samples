"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  FormData,
  FormErrors,
  PasswordStrength,
  STEPS,
} from "./RegisterForm.types";
import {
  validateStep,
  validateForm,
  calculatePasswordStrength,
} from "./validation/RegisterForm.validation";
import { convertToE164 } from "@/utils/phoneUtils";
import UserTypeStep from "./steps/RegisterForm.UserType";
import ContactInfoStep from "./steps/RegisterForm.ContactInfo";
import PasswordStep from "./steps/RegisterForm.Password";
import { getErrorMessage } from "@/utils/errors";
import { Button } from "@/components/ui/button";

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const RegisterForm = ({ onSuccess, onError }: RegisterFormProps) => {
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    username: "",
    phone_number: "",
    user_type: "client",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });

  // Password strength calculation
  useEffect(() => {
    const strength = calculatePasswordStrength(formData.password);
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear general error
    if (generalError) {
      setGeneralError("");
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      phone_number: value,
    }));

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      phone_number: true,
    }));

    // Clear phone number error
    if (errors.phone_number) {
      setErrors((prev) => ({
        ...prev,
        phone_number: "",
      }));
    }

    // Clear general error
    if (generalError) {
      setGeneralError("");
    }
  };

  const handleUserTypeChange = (userType: "client" | "tutor") => {
    setFormData((prev) => ({
      ...prev,
      user_type: userType,
    }));
  };

  const validateCurrentStep = (): boolean => {
    const currentStepFields = STEPS[currentStep].fields;
    const newErrors = validateStep(currentStepFields, formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setGeneralError("");

    // Mark current step fields as touched
    const currentStepFields = STEPS[currentStep].fields;
    const touchedFields = { ...touched };
    currentStepFields.forEach((field) => {
      touchedFields[field] = true;
    });
    setTouched(touchedFields);

    if (validateCurrentStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    // Mark all fields as touched to show validation errors
    const allFields: (keyof FormData)[] = [
      "email",
      "password",
      "password_confirm",
      "first_name",
      "last_name",
      "username",
      "phone_number",
    ];
    const touchedFields = allFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as { [key: string]: boolean });
    setTouched(touchedFields);

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert phone number to E.164 format before sending to backend
      const registrationData = {
        ...formData,
        phone_number: convertToE164(formData.phone_number),
      };

      await register(registrationData);
      onSuccess?.();
    } catch (err) {
      console.log(err);
      const message = getErrorMessage(err);
      setGeneralError(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepConfig = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const renderCurrentStep = () => {
    const baseProps = {
      formData,
      errors,
      touched,
      isSubmitting,
      isLoading,
      onInputChange: handleInputChange,
      onPhoneNumberChange: handlePhoneNumberChange,
    };

    switch (currentStep) {
      case 0:
        return (
          <UserTypeStep
            {...baseProps}
            onUserTypeChange={handleUserTypeChange}
          />
        );
      case 1:
        return <ContactInfoStep {...baseProps} />;
      case 2:
        return (
          <PasswordStep {...baseProps} passwordStrength={passwordStrength} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-12 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] w-full max-w-[540px] border border-gray-50">
      <div className="text-center mb-10">
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index <= currentStep ? "w-8 bg-blue-600" : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>
        <h2 className="text-[2rem] font-bold mb-2 bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent leading-tight">
          {currentStepConfig.title}
        </h2>
        <p className="text-gray-500 text-sm">{currentStepConfig.subtitle}</p>
      </div>

      <form
        onSubmit={
          isLastStep
            ? handleSubmit
            : (e) => {
                e.preventDefault();
                handleNext();
              }
        }
      >
        {generalError && (
          <div className="text-red-600 text-sm text-center p-3 bg-red-50/80 border border-red-100 rounded-lg mb-5">
            {generalError}
          </div>
        )}

        {/* Render current step */}
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {currentStep > 0 && (
            <Button
              type="button"
              onClick={handleBack}
              variant="outline"
              disabled={isSubmitting || isLoading}
              className="flex-1 h-12 border-2 border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              Back
            </Button>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className={`h-12 bg-blue-600 text-white rounded-lg font-semibold text-[15px] transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98] disabled:opacity-50 ${
              currentStep === 0 ? "w-full" : "flex-1"
            }`}
          >
            {isSubmitting || isLoading
              ? isLastStep
                ? "Creating Account..."
                : "Processing..."
              : isLastStep
              ? "Create Account"
              : "Next"}
          </Button>
        </div>
      </form>

      <p className="text-center mt-6 text-gray-600 text-sm">
        Already have an account?{" "}
        <Link
          href="/accounts/login"
          className="text-blue-600 font-semibold hover:text-blue-700 transition-colors hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterForm;
