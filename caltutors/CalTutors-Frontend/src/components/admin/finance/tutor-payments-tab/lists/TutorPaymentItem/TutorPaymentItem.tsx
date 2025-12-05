import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import {
  SessionsTable,
  type SessionRow,
} from "@/components/ui/sessions/SessionTable";
import type { TutorPayment } from "@/types/admin_management";

interface TutorPaymentItemProps {
  payment: TutorPayment;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TutorPaymentItem({
  payment,
  isExpanded,
  onToggle,
}: TutorPaymentItemProps) {
  const computeAmount = (rate: string | null | undefined, minutes: number) => {
    if (!rate) return null;
    const numericRate = Number(rate);
    if (Number.isNaN(numericRate)) return null;
    const amount = (numericRate * minutes) / 60;
    return amount.toFixed(2);
  };

  const tutorFullName = `${payment.tutor.first_name} ${payment.tutor.last_name}`;

  const sessionRows: SessionRow[] = payment.sessions.map((session) => {
    const studentRate = session.student_rate ?? null;
    const tutorRate = session.tutor_rate ?? session.tutor_pay_rate ?? null;

    const studentCharge =
      session.student_charge ??
      computeAmount(studentRate, session.duration_minutes);
    const tutorPayment =
      session.tutor_payment ??
      session.session_amount ??
      computeAmount(tutorRate, session.duration_minutes);

    return {
      id: session.id,
      start_time: session.start_time,
      duration_minutes: session.duration_minutes,
      student_name: session.student_name,
      tutor_name: tutorFullName,
      student_rate: studentRate,
      student_charge: studentCharge,
      tutor_rate: tutorRate,
      tutor_payment: tutorPayment,
    };
  });

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
              {payment.tutor.first_name} {payment.tutor.last_name}
            </p>
            <p className="text-sm text-gray-500">{payment.tutor.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">
            {formatCurrency(payment.total_amount)}
          </p>
          <p className="text-sm text-gray-500">
            {payment.session_count}{" "}
            {payment.session_count === 1 ? "session" : "sessions"}
          </p>
        </div>
      </button>

      {isExpanded && sessionRows.length > 0 && (
        <SessionsTable sessions={sessionRows} />
      )}
    </div>
  );
}
