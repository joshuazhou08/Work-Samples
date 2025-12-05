import { TutorPaymentItem } from "../TutorPaymentItem";
import type { TutorPayment } from "@/types/admin_management";

interface TutorPaymentsListProps {
  tutorPayments: TutorPayment[];
  expandedTutors: Set<number>;
  onToggleTutor: (tutorId: number) => void;
}

export function TutorPaymentsList({
  tutorPayments,
  expandedTutors,
  onToggleTutor,
}: TutorPaymentsListProps) {
  return (
    <div className="space-y-2">
      {tutorPayments.map((payment) => (
        <TutorPaymentItem
          key={payment.tutor.id}
          payment={payment}
          isExpanded={expandedTutors.has(payment.tutor.id)}
          onToggle={() => onToggleTutor(payment.tutor.id)}
        />
      ))}
    </div>
  );
}
