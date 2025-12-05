import React from "react";
import { BaseStepProps } from "../RegisterForm.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneNumberInput } from "@/components/ui/general";

const ContactInfoStep = ({
  formData,
  errors,
  touched,
  isSubmitting,
  isLoading,
  onInputChange,
  onPhoneNumberChange,
}: BaseStepProps) => {
  return (
    <>
      {/* Email */}
      <div className="mb-5">
        <Label
          htmlFor="email"
          className="text-sm font-medium text-gray-700 block mb-2"
        >
          Email Address
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={onInputChange}
          placeholder="you@example.com"
          className={`h-12 px-4 border rounded-lg text-[15px] transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full ${
            touched.email && errors.email ? "border-red-500" : "border-gray-200"
          }`}
          autoComplete="email"
          disabled={isSubmitting || isLoading}
        />
        {touched.email && errors.email && (
          <p className="text-red-600 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      {/* Username and Phone */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <Label
            htmlFor="username"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Username
          </Label>
          <Input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={onInputChange}
            placeholder="johndoe123"
            className={`h-12 px-4 border rounded-lg text-[15px] transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full ${
              touched.username && errors.username
                ? "border-red-500"
                : "border-gray-200"
            }`}
            autoComplete="username"
            disabled={isSubmitting || isLoading}
          />
          {touched.username && errors.username && (
            <p className="text-red-600 text-xs mt-1">{errors.username}</p>
          )}
        </div>

        <div>
          <Label
            htmlFor="phone_number"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Phone Number
          </Label>
          <PhoneNumberInput
            id="phone_number"
            value={formData.phone_number}
            onChange={onPhoneNumberChange!}
            className="h-12 px-4 text-[15px]"
            disabled={isSubmitting || isLoading}
            validate
            required
            error={
              touched.phone_number && errors.phone_number
                ? errors.phone_number
                : ""
            }
          />
        </div>
      </div>
    </>
  );
};

export default ContactInfoStep;
