import { useEffect, useState } from "react";
import { Users, BookOpen, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import StatsGrid from "@/components/ui/general/StatsGrid";
import ActivityFeed from "@/components/ui/dashboard/ActivityFeed";
import QuickActions from "@/components/ui/dashboard/QuickActions";

interface DashboardStats {
  totalUsers: number;
  totalTutors: number;
  totalSessions: number;
  activeSubjects: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTutors: 0,
    totalSessions: 0,
    activeSubjects: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // TODO: Replace with actual API calls when backend endpoints are ready
        // For now, using mock data
        setStats({
          totalUsers: 156,
          totalTutors: 24,
          totalSessions: 89,
          activeSubjects: 12,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // TODO: Replace with actual API calls when backend endpoints are ready
  // For now, using mock data
  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "blue",
      change: "+12%",
    },
    {
      title: "Active Tutors",
      value: stats.totalTutors,
      icon: BookOpen,
      color: "green",
      change: "+8%",
    },
    {
      title: "Sessions This Month",
      value: stats.totalSessions,
      icon: Calendar,
      color: "purple",
      change: "+23%",
    },
    {
      title: "Active Subjects",
      value: stats.activeSubjects,
      icon: TrendingUp,
      color: "orange",
      change: "+5%",
    },
  ];

  const activities = [
    {
      icon: Users,
      text: "New student registration: John Doe",
      time: "2 hours ago",
    },
    {
      icon: Calendar,
      text: "Session completed: Math Tutoring",
      time: "4 hours ago",
    },
    {
      icon: BookOpen,
      text: "New tutor approved: Sarah Smith",
      time: "1 day ago",
    },
  ];

  const quickActions = [
    {
      icon: Users,
      label: "Manage Users",
      onClick: () => console.log("Navigate to user management"),
    },
    {
      icon: BookOpen,
      label: "Add Subject",
      onClick: () => console.log("Navigate to subject management"),
    },
    {
      icon: Calendar,
      label: "View Sessions",
      onClick: () => console.log("Navigate to session management"),
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 text-base md:text-lg">
          Welcome back, {user?.first_name || "Admin"}! Here's what's happening
          with CalTutors.
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={statsCards} isLoading={isLoading} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-8">
        <ActivityFeed activities={activities} isLoading={isLoading} />
        <QuickActions actions={quickActions} />
      </div>
    </>
  );
};

export default AdminDashboard;
