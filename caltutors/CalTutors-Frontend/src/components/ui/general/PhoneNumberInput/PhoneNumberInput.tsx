"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatPhoneNumber,
  validatePhoneNumber,
} from "@/utils/phoneUtils";

interface PhoneNumberInputProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    "type" | "value" | "onChange"
  > {
  value: string;
  onChange: (value: string, meta?: { isValid: boolean }) => void;
  /**
   * Optional external error message.
   * If provided, the component will display this message and mark the field invalid.
   */
  error?: string;
  /**
   * Enables built-in validation logic. When enabled the component emits validity state
   * and displays a default error message if the value is invalid.
   */
  validate?: boolean;
  /**
   * Called whenever the computed validity changes.
   */
  onValidityChange?: (isValid: boolean) => void;
  /**
   * Controls whether the default error message is shown when validation fails.
   * Ignored when a custom `error` prop is provided. Defaults to true.
   */
  showErrorMessage?: boolean;
  defaultCountry?: "US" | string;
}

/**
 * Phone Number Input Component
 * Uses libphonenumber-js for automatic formatting as user types
 * Supports both US and international numbers
 */
export function PhoneNumberInput({
  value,
  onChange,
  error,
  validate = false,
  onValidityChange,
  showErrorMessage = true,
  defaultCountry = "US",
  className,
  onBlur,
  required,
  ...inputProps
}: PhoneNumberInputProps) {
  const errorId = useId();
  const [touched, setTouched] = useState(false);

  const trimmedValue = value?.trim() ?? "";
  const hasValue = trimmedValue.length > 0;

  const computedValidity = useMemo(() => {
    if (!validate) return true;
    if (!hasValue) return !required;
    return validatePhoneNumber(trimmedValue, defaultCountry);
  }, [validate, hasValue, trimmedValue, defaultCountry, required]);

  useEffect(() => {
    if (!validate) return;
    onValidityChange?.(computedValidity);
  }, [computedValidity, validate, onValidityChange]);

  const derivedError = useMemo(() => {
    if (error) return error;
    if (!validate || !touched) return "";
    if (!hasValue && required) return "Phone number is required";
    if (hasValue && !computedValidity)
      return "Please enter a valid phone number";
    return "";
  }, [error, validate, touched, hasValue, required, computedValidity]);

  const hasError = derivedError.length > 0;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    // Allow empty input
    if (!inputValue) {
      onChange("", { isValid: !required });
      onValidityChange?.(!required);
      return;
    }

    // Use libphonenumber-js to format as user types
    const formatted = formatPhoneNumber(inputValue, defaultCountry);
    const formattedTrimmed = formatted.trim();
    const nextValidity = formattedTrimmed
      ? validatePhoneNumber(formattedTrimmed, defaultCountry)
      : !required;

    onChange(formatted, { isValid: nextValidity });
    onValidityChange?.(nextValidity);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    onBlur?.(event);

    if (!validate) return;
    const isValidOnBlur = hasValue
      ? validatePhoneNumber(trimmedValue, defaultCountry)
      : !required;
    onValidityChange?.(isValidOnBlur);
  };

  return (
    <>
      <Input
        type="tel"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          hasError
            ? "border-red-500 focus:border-red-500 focus:ring-red-200"
            : "border-gray-200 focus:border-blue-400 focus:ring-blue-100",
          className
        )}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        autoComplete="tel"
        required={required}
        {...inputProps}
      />
      {hasError && showErrorMessage && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {derivedError}
        </p>
      )}
    </>
  );
}
