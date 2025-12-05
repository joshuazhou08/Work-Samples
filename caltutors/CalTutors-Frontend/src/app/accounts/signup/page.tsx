"use client";

import React from "react";
import RegisterForm from "@/components/auth/RegisterForm";
const SignupPage = () => {
  const handleRegistrationSuccess = () => {
    // Registration success is handled by the AuthContext
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--background)] to-[var(--background-alt)] p-4 sm:p-6">
      <RegisterForm onSuccess={handleRegistrationSuccess} />
    </div>
  );
};

export default SignupPage;
