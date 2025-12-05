"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/admin/dashboard";
import { ClientDashboard } from "@/components/client/dashboard";
import { ClientSessions } from "@/components/client/dashboard/ClientSessions";
import { Popup } from "@/components/ui/general";

const PaymentStatusPopup = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"success" | "failed" | null>(null);

  useEffect(() => {
    const paymentStatus = searchParams?.get("payment");
    if (!paymentStatus || !pathname) {
      return;
    }

    if (paymentStatus === "success" || paymentStatus === "failed") {
      setStatus(paymentStatus);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("payment");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
  }, [pathname, router, searchParams]);

  if (!status) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
      <Popup
        status={status}
        message={
          status === "success"
            ? "Payment completed successfully."
            : "Payment did not complete. Please try again."
        }
        onDismiss={() => setStatus(null)}
      />
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();

  const renderDashboardContent = () => {
    switch (user?.user_type) {
      case "admin":
        return <AdminDashboard />;
      case "tutor":
        return (
          <div className="p-6 bg-white">
            <h1 className="text-2xl font-bold mb-4">Tutor Dashboard</h1>
            <p className="text-gray-600">Tutor dashboard coming soon...</p>
          </div>
        );
      case "client":
        return (
          <>
            <PaymentStatusPopup />
            <div className="space-y-6">
              <ClientDashboard />
              <div className="px-6">
                <ClientSessions />
              </div>
            </div>
          </>
        );
      default:
        return (
          <div className="flex items-center justify-center min-h-screen text-gray-500">
            <p>Unknown user type. Please contact support.</p>
          </div>
        );
    }
  };

  return renderDashboardContent();
};

export default DashboardPage;
