"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/utils/errors";

const PasswordResetPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setIsSubmitting(true);
      const message = await authService.requestPasswordReset(email.trim());
      setSuccessMessage(message);
      setEmail("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6 space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Reset Your Password</h1>
          <p className="text-sm text-gray-600">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="you@example.com"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="w-full"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        {successMessage && (
          <p className="text-sm text-green-600 border border-green-200 bg-green-50 rounded-md px-3 py-2">
            {successMessage}
          </p>
        )}
        {errorMessage && (
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">
            {errorMessage}
          </p>
        )}

        <div className="text-center">
          <Link href="/accounts/login" className="text-sm text-blue-600 hover:text-blue-500">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
