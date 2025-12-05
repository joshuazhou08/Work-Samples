import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions = ({ actions }: QuickActionsProps) => {
  return (
    <Card className="border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              onClick={action.onClick}
              variant="soft"
              className="w-full justify-start gap-4 h-auto p-4 rounded-lg group"
            >
              <div className="p-2.5 bg-white group-hover:bg-blue-100/80 rounded-lg transition-all duration-300 shadow-sm">
                <Icon size={20} className="flex-shrink-0" />
              </div>
              <span>{action.label}</span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
