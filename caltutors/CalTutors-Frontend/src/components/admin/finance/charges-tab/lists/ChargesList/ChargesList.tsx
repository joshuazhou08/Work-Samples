import { ChargeItem } from "../ChargeItem";
import type { Charge } from "@/types/admin_management";

interface ChargesListProps {
  charges: Charge[];
  expandedCharges: Set<number>;
  onToggleCharge: (chargeId: number) => void;
}

export function ChargesList({
  charges,
  expandedCharges,
  onToggleCharge,
}: ChargesListProps) {
  return (
    <div className="space-y-2">
      {charges.map((charge) => (
        <ChargeItem
          key={charge.id}
          charge={charge}
          isExpanded={expandedCharges.has(charge.id)}
          onToggle={() => onToggleCharge(charge.id)}
        />
      ))}
    </div>
  );
}
