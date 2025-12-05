"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      const message: string = getErrorMessage(err);
      setError(message);
      console.error(message);
    }
  };

  return (
    <div className="bg-white p-12 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] w-full max-w-[440px] border border-gray-50">
      <div className="text-center mb-10">
        <h2 className="text-[2rem] font-bold mb-2 bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent leading-tight">
          Welcome Back
        </h2>
        <p className="text-gray-500 text-sm">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="text-red-600 text-sm text-center p-3 bg-red-50/80 border border-red-100 rounded-lg mb-5">
            {error}
          </div>
        )}

        <div className="mb-5">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-gray-700 block mb-2"
          >
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 px-4 border border-gray-200 rounded-lg text-[15px] transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full"
          />
        </div>

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
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="h-12 px-4 border border-gray-200 rounded-lg text-[15px] transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full"
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label
              htmlFor="remember-me"
              className="text-sm font-normal text-gray-600 cursor-pointer select-none"
            >
              Remember me
            </Label>
          </div>
          <Link
            href="/accounts/password-reset"
            className="text-blue-600 text-sm font-medium transition-colors hover:text-blue-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-600 text-white rounded-lg font-semibold text-[15px] transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-4 text-gray-500 font-medium">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        disabled
        className="w-full h-11 border-2 border-gray-200 rounded-lg font-medium text-sm text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-all"
      >
        Coming Soon
      </Button>

      <p className="text-center mt-8 text-gray-600 text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/accounts/signup"
          className="text-blue-600 font-semibold hover:text-blue-700 transition-colors hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
