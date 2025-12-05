"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth";
import { getErrorMessage } from "@/utils/errors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  validateForm,
  validateField,
  SettingsFormErrors,
  SettingsFormData,
} from "./validation/SettingsForm.validation";
import { PhoneNumberInput } from "@/components/ui/general";
import { UpdateProfilePayload } from "@/types/auth";
import { convertToE164 } from "@/utils/phoneUtils";
import {
  TIMEZONE_OPTIONS,
  formatTimezoneLabel,
  getLocalTimezone,
} from "@/utils/timezones";
import { cn } from "@/lib/utils";

const SETTINGS_FIELDS: (keyof SettingsFormData)[] = [
  "first_name",
  "last_name",
  "email",
  "username",
  "phone_number",
  "timezone",
];

const toSettingsFormData = (
  payload: UpdateProfilePayload
): SettingsFormData => ({
  email: payload.email ?? "",
  username: payload.username ?? "",
  first_name: payload.first_name ?? "",
  last_name: payload.last_name ?? "",
  phone_number: payload.phone_number ?? "",
  timezone: payload.timezone ?? "",
});

interface SettingsFormProps {
  onSuccess?: () => void;
}

export default function SettingsForm({ onSuccess }: SettingsFormProps) {
  const { user, isLoading, refreshUser } = useAuth();
  const [formData, setFormData] = useState<UpdateProfilePayload>({
    email: user?.email ?? "",
    username: user?.username ?? "",
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone_number: user?.phone_number ?? "",
    timezone: user?.timezone ?? getLocalTimezone(),
  });
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<SettingsFormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof SettingsFormData, boolean>>
  >({});

  if (!user) {
    return null;
  }

  useEffect(() => {
    setFormData({
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number ?? "",
      timezone: user.timezone ?? getLocalTimezone(),
    });
  }, [user]);

  const updateField = (field: keyof UpdateProfilePayload, value: string) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    };

    setFormData(nextFormData);

    const fieldName = field as keyof SettingsFormData;
    if (SETTINGS_FIELDS.includes(fieldName)) {
      const updatedData = toSettingsFormData(nextFormData);
      const errorMessage = validateField(fieldName, updatedData);

      setFieldErrors((prev) => {
        if (errorMessage) {
          return { ...prev, [fieldName]: errorMessage };
        }
        const { [fieldName]: _removed, ...rest } = prev;
        return rest;
      });
    }

    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const touchedFields = SETTINGS_FIELDS.reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {} as Partial<Record<keyof SettingsFormData, boolean>>
    );
    setTouched(touchedFields);

    const validationData = toSettingsFormData(formData);
    const validationErrors = validateForm(validationData);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.updateProfile({
        ...formData,
        phone_number: convertToE164(formData.phone_number ?? ""),
      });
      await refreshUser();
      setSuccessMessage("Profile updated successfully.");
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={formData.first_name ?? ""}
            onChange={(event) => updateField("first_name", event.target.value)}
            placeholder="First name"
            required
            disabled={isSubmitting || isLoading}
            autoComplete="given-name"
            className={
              touched.first_name && fieldErrors.first_name
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : undefined
            }
            aria-invalid={!!(touched.first_name && fieldErrors.first_name)}
            aria-describedby={
              touched.first_name && fieldErrors.first_name
                ? "first_name-error"
                : undefined
            }
          />
          {touched.first_name && fieldErrors.first_name && (
            <p id="first_name-error" className="text-sm text-red-600">
              {fieldErrors.first_name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={formData.last_name ?? ""}
            onChange={(event) => updateField("last_name", event.target.value)}
            placeholder="Last name"
            required
            disabled={isSubmitting || isLoading}
            autoComplete="family-name"
            className={
              touched.last_name && fieldErrors.last_name
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : undefined
            }
            aria-invalid={!!(touched.last_name && fieldErrors.last_name)}
            aria-describedby={
              touched.last_name && fieldErrors.last_name
                ? "last_name-error"
                : undefined
            }
          />
          {touched.last_name && fieldErrors.last_name && (
            <p id="last_name-error" className="text-sm text-red-600">
              {fieldErrors.last_name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email ?? ""}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@example.com"
            required
            disabled={isSubmitting || isLoading}
            autoComplete="email"
            className={
              touched.email && fieldErrors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : undefined
            }
            aria-invalid={!!(touched.email && fieldErrors.email)}
            aria-describedby={
              touched.email && fieldErrors.email ? "email-error" : undefined
            }
          />
          {touched.email && fieldErrors.email && (
            <p id="email-error" className="text-sm text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username ?? ""}
            onChange={(event) => updateField("username", event.target.value)}
            placeholder="Choose a unique username"
            required
            disabled={isSubmitting || isLoading}
            autoComplete="username"
            className={
              touched.username && fieldErrors.username
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : undefined
            }
            aria-invalid={!!(touched.username && fieldErrors.username)}
            aria-describedby={
              touched.username && fieldErrors.username
                ? "username-error"
                : undefined
            }
          />
          {touched.username && fieldErrors.username && (
            <p id="username-error" className="text-sm text-red-600">
              {fieldErrors.username}
            </p>
          )}
        </div>

        <div className="sm:col-span-2 grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <PhoneNumberInput
              id="phone_number"
              value={formData.phone_number ?? ""}
              onChange={(value) => updateField("phone_number", value)}
              placeholder="(555) 123-4567"
              disabled={isSubmitting || isLoading}
              validate
              required={false}
              error={
                touched.phone_number && fieldErrors.phone_number
                  ? fieldErrors.phone_number
                  : ""
              }
              onBlur={(event) => {
                updateField("phone_number", event.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone ?? ""}
              onValueChange={(value) => updateField("timezone", value)}
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger
                id="timezone"
                className={cn(
                  touched.timezone && fieldErrors.timezone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : undefined
                )}
                aria-invalid={touched.timezone && !!fieldErrors.timezone}
                aria-describedby={
                  touched.timezone && fieldErrors.timezone
                    ? "timezone-error"
                    : undefined
                }
              >
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((timezone) => (
                  <SelectItem key={timezone} value={timezone}>
                    {formatTimezoneLabel(timezone)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.timezone && fieldErrors.timezone && (
              <p id="timezone-error" className="text-sm text-red-600">
                {fieldErrors.timezone}
              </p>
            )}
            <p className="text-sm text-gray-500">
              This timezone will be used when displaying session times and invoices.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
