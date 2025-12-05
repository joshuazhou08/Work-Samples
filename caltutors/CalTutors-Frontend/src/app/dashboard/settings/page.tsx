"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SettingsForm } from "@/components/auth/SettingsForm";
import { useAuth } from "@/contexts/AuthContext";
import { ClientPaymentSection } from "@/components/client/dashboard/ClientPayments";

export default function DashboardSettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/accounts/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading settings...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const paymentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.location.hash === "#billing") {
      paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-2 text-gray-600">
          Update your profile information to keep your account current.
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SettingsForm />
        </section>

        {user.user_type === "client" && (
          <div
            ref={paymentRef}
            className="rounded-xl border border-slate-200 bg-white p-0 shadow-sm"
          >
            <ClientPaymentSection user={user} />
          </div>
        )}
      </div>
    </div>
  );
}
