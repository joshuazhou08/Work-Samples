import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Activity {
  icon: LucideIcon;
  text: string;
  time: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
}

const ActivityFeed = ({ activities, isLoading = false }: ActivityFeedProps) => {
  if (isLoading) {
    return (
      <Card className="border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-center py-8">
            Loading activities...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-xl">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-4 p-3 rounded-lg border border-transparent hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200"
            >
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium mb-1">
                  {activity.text}
                </p>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
