import { LucideIcon } from "lucide-react";
import { StatsCard } from "@/components/ui/dashboard";

interface StatCard {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  change: string;
}

interface StatsGridProps {
  stats: StatCard[];
  isLoading?: boolean;
}

const colorMapping: Record<string, { iconColor: string; iconBgColor: string }> =
  {
    blue: { iconColor: "text-blue-600", iconBgColor: "bg-blue-50" },
    green: { iconColor: "text-emerald-600", iconBgColor: "bg-emerald-50" },
    purple: { iconColor: "text-purple-600", iconBgColor: "bg-purple-50" },
    orange: { iconColor: "text-orange-600", iconBgColor: "bg-orange-50" },
  };

const StatsGrid = ({ stats, isLoading = false }: StatsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="h-32 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((card, index) => {
        const colors = colorMapping[card.color] || colorMapping.blue;
        return (
          <StatsCard
            key={index}
            icon={card.icon}
            value={card.value}
            label={card.title}
            iconColor={colors.iconColor}
            iconBgColor={colors.iconBgColor}
            change={card.change}
          />
        );
      })}
    </div>
  );
};

export default StatsGrid;
