"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";

type Status = "success" | "failed";

interface PopupProps {
  status: Status;
  message: string;
  onDismiss?: () => void;
  className?: string;
  dismissLabel?: string;
}

const statusStyles: Record<Status, string> = {
  success: "bg-green-50 border-green-200 text-green-700",
  failed: "bg-red-50 border-red-200 text-red-700",
};

const statusIcon: Record<Status, JSX.Element> = {
  success: <CheckCircle2 size={18} />,
  failed: <CircleAlert size={18} />,
};

export function Popup({
  status,
  message,
  onDismiss,
  className = "",
  dismissLabel = "Dismiss",
}: PopupProps) {
  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-full border px-4 py-2 shadow-lg ${statusStyles[status]} ${className}`}
    >
      {statusIcon[status]}
      <span className="text-sm">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium underline cursor-pointer"
        >
          {dismissLabel}
        </button>
      ) : null}
    </div>
  );
}
