import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import {
  SessionsTable,
  type SessionRow,
} from "@/components/ui/sessions/SessionTable";
import type { Charge } from "@/types/admin_management";

interface ChargeItemProps {
  charge: Charge;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ChargeItem({ charge, isExpanded, onToggle }: ChargeItemProps) {
  const computeAmount = (rate: string | null | undefined, minutes: number) => {
    if (!rate) return null;
    const numericRate = Number(rate);
    if (Number.isNaN(numericRate)) return null;
    const amount = (numericRate * minutes) / 60;
    return amount.toFixed(2);
  };

  const sessionRows: SessionRow[] = charge.session_details.map((session) => {
    const studentRate = session.student_rate ?? null;
    const tutorRate = session.tutor_rate ?? null;

    const studentCharge =
      session.student_charge ??
      computeAmount(studentRate, session.duration_minutes);
    const tutorPayment =
      session.tutor_payment ??
      computeAmount(tutorRate, session.duration_minutes);

    return {
      id: session.id,
      start_time: session.start_time,
      duration_minutes: session.duration_minutes,
      student_name: session.student_name,
      tutor_name: session.tutor_name,
      student_rate: studentRate,
      student_charge: studentCharge,
      tutor_rate: tutorRate,
      tutor_payment: tutorPayment,
    };
  });

  const credits: number = parseInt(charge.credits_applied);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
          <div className="text-left">
            <p className="font-medium text-gray-900">
              Client: {charge.user_info.first_name} {charge.user_info.last_name}
            </p>
            {charge.session_details.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Students:{" "}
                {Array.from(
                  new Set(charge.session_details.map((s) => s.student_name))
                ).join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex items-center gap-4">
          <div>
            <p className="font-bold text-gray-900">
              {formatCurrency(charge.final_amount)}
            </p>
            <p className="text-sm text-gray-500">
              {credits > 0
                ? `Credits applied: ${formatCurrency(credits)}`
                : "No credits applied"}
            </p>
            <p className="text-sm text-gray-500">
              {charge.session_count}{" "}
              {charge.session_count === 1 ? "session" : "sessions"}
            </p>
          </div>
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                charge.status === "paid"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {charge.status.charAt(0).toUpperCase() + charge.status.slice(1)}
            </span>
          </div>
        </div>
      </button>

      {isExpanded && sessionRows.length > 0 && (
        <SessionsTable sessions={sessionRows} />
      )}
    </div>
  );
}
