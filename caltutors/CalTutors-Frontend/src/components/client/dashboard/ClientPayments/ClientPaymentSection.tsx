"use client";

import { useState, useCallback } from "react";
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  type LucideIcon,
} from "lucide-react";
import type { User } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/payment";
import { getErrorMessage } from "@/utils/errors";

interface ClientPaymentSectionProps {
  user: User;
}

type BillingStatus = "missing" | "invalid" | "valid";

interface StatusMeta {
  label: string;
  description: string;
  badgeClass: string;
  icon: LucideIcon;
}

const STATUS_CONTENT: Record<BillingStatus, StatusMeta> = {
  missing: {
    label: "No Payment Method",
    description:
      "Add a card so you can pay invoices automatically and avoid delays.",
    badgeClass: "text-amber-700 bg-amber-100",
    icon: CircleDashed,
  },
  invalid: {
    label: "Action Required",
    description: "Your saved payment method needs attention. Please review it.",
    badgeClass: "text-red-700 bg-red-100",
    icon: AlertTriangle,
  },
  valid: {
    label: "Payment Method On File",
    description:
      "Your saved payment method looks good. Visit Stripe to update or replace it.",
    badgeClass: "text-green-700 bg-green-100",
    icon: CheckCircle2,
  },
};

export function ClientPaymentSection({ user }: ClientPaymentSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const billingStatus = (user.billing_status as BillingStatus) ?? "missing";
  const statusMeta = STATUS_CONTENT[billingStatus] ?? STATUS_CONTENT.missing;
  const StatusIcon = statusMeta.icon;

  const handleManagePayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { url } = await paymentService.createBillingPortalSession();
      if (url) {
        window.location.href = url;
        return;
      }
      setError("Unable to open the Stripe billing portal. Please try again.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <section data-testid="client-payment-section" id="billing-settings">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-blue-50 text-blue-700">
            <CreditCard size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Method
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${statusMeta.badgeClass}`}
              >
                <StatusIcon size={16} />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {statusMeta.description}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Managing payment methods opens Stripe’s secure customer portal.
          </p>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={handleManagePayment}
            disabled={isLoading}
          >
            {isLoading ? "Opening Stripe…" : "Manage Payment Methods"}
          </Button>
        </div>
      </div>
    </section>
  );
}
