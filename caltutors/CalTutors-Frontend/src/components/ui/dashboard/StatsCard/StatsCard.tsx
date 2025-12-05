import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor?: string;
  iconBgColor?: string;
  change?: string;
  valueFormatter?: (value: string | number) => string;
}

export function StatsCard({
  icon: Icon,
  value,
  label,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-50",
  change,
  valueFormatter,
}: StatsCardProps) {
  const displayValue = valueFormatter ? valueFormatter(value) : value;

  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${iconBgColor} ${iconColor}`}>
            <Icon size={24} />
          </div>
          {change && (
            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {change}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {displayValue}
          </h3>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
