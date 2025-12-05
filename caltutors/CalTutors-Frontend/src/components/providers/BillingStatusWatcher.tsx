"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

export function BillingStatusWatcher() {
  const { user } = useAuth();
  const { showNotification, dismissNotification } = useNotifications();
  const router = useRouter();
  const lastStatusRef = useRef<string | null>(null);
  const lastNotificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    const clearNotification = () => {
      if (lastNotificationIdRef.current) {
        dismissNotification(lastNotificationIdRef.current);
        lastNotificationIdRef.current = null;
      }
    };

    if (!user || user.user_type !== "client") {
      lastStatusRef.current = null;
      clearNotification();
      return;
    }

    const status = user.billing_status ?? "missing";
    if (status === "valid") {
      lastStatusRef.current = null;
      clearNotification();
      return;
    }

    if (lastStatusRef.current === status) {
      return;
    }

    lastStatusRef.current = status;
    clearNotification();

    const isInvalid = status === "invalid";
    const id = showNotification({
      title: isInvalid
        ? "Payment method needs attention"
        : "Add a payment method",
      message: isInvalid
        ? "Your saved card was declined. Update it to avoid interruptions."
        : "Please add a payment method to keep your tutoring sessions running without delays.",
      variant: isInvalid ? "error" : "warning",
      actionLabel: "Manage payment methods",
      onAction: () => router.push("/dashboard/settings#billing"),
    });
    lastNotificationIdRef.current = id;
  }, [user, showNotification, dismissNotification, router]);

  return null;
}
