"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

type NotificationVariant = "info" | "warning" | "error";

export interface NotificationInput {
  title: string;
  message: string;
  variant?: NotificationVariant;
  actionLabel?: string;
  onAction?: () => void;
}

interface Notification extends NotificationInput {
  id: string;
  variant: NotificationVariant;
}

interface NotificationContextValue {
  showNotification: (notification: NotificationInput) => string;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 9);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((input: NotificationInput) => {
    const id = createId();
    setNotifications((current) => [
      ...current,
      { id, variant: input.variant ?? "info", ...input },
    ]);
    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={useMemo(
        () => ({
          showNotification,
          dismissNotification,
        }),
        [showNotification, dismissNotification]
      )}
    >
      {children}
      <NotificationPortal
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return ctx;
}

function NotificationPortal({
  notifications,
  onDismiss,
}: {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}) {
  if (!notifications.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[2000] flex flex-col gap-3 w-full max-w-sm">
      {notifications.map((notification) => {
        const colorClasses =
          notification.variant === "error"
            ? "border-red-200 bg-red-50"
            : notification.variant === "warning"
              ? "border-amber-200 bg-amber-50"
              : "border-blue-200 bg-blue-50";

        return (
          <div
            key={notification.id}
            className={`pointer-events-auto rounded-2xl border shadow-lg p-4 space-y-3 ${colorClasses}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  {notification.message}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500 hover:text-gray-900"
                onClick={() => onDismiss(notification.id)}
              >
                <span className="sr-only">Dismiss</span>
                ×
              </Button>
            </div>
            {notification.actionLabel && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => notification.onAction?.()}
                >
                  {notification.actionLabel}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
