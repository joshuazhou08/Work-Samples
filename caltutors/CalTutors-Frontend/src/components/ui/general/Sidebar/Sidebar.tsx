"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userType?: "admin" | "tutor" | "client";
  onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar = ({ userType = "admin", onCollapseChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  const handleMobileToggle = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Users", href: "/dashboard/user-management" },
    { icon: BookOpen, label: "Finances", href: "/dashboard/finances" },
    { icon: Calendar, label: "Sessions", href: "/dashboard/sessions" },
    {
      icon: MessageSquare,
      label: "Messages",
      href: "/dashboard/messages",
    },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  const tutorNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  const clientNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  const navItems =
    userType === "admin"
      ? adminNavItems
      : userType === "tutor"
      ? tutorNavItems
      : clientNavItems;

  const handleLogout = () => {
    logout();
  };

  return (
    <div
      className={cn(
        "bg-white border-gray-200 flex flex-col transition-all duration-300 z-[1000]",
        "border-b md:border-b-0 md:border-r",
        "w-full md:fixed md:top-0 md:left-0 md:h-screen",
        isCollapsed ? "md:w-20" : "md:w-[280px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-6 border-b border-gray-100 min-h-[80px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-[10px] flex items-center justify-center text-white text-[22px] font-bold shadow-lg shadow-blue-500/25 flex-shrink-0">
            C
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold whitespace-nowrap bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
              CalTutors
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 text-gray-500 hover:text-gray-700 md:hidden"
          onClick={handleMobileToggle}
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 text-gray-500 hover:text-gray-700 hidden md:flex"
          onClick={handleToggle}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "md:flex-1 py-4 overflow-y-auto",
          isMobileOpen ? "block" : "hidden md:block"
        )}
      >
        <ul className="flex flex-col gap-1 m-0 p-0 list-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href} className="mx-3">
                <Button
                  variant="ghost"
                  asChild
                  className={cn(
                    "w-full justify-start gap-3 px-5 py-3 h-auto min-h-[44px] font-medium text-sm transition-all duration-200",
                    isActive
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 w-full"
                    onClick={closeMobileMenu}
                  >
                    <Icon size={20} className="flex-shrink-0 w-5 h-5" />
                    {!isCollapsed && (
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "px-3 py-4 pb-6 border-t border-gray-100",
          isMobileOpen ? "block" : "hidden md:block"
        )}
      >
        <Button
          variant="ghost"
          onClick={() => {
            handleLogout();
            closeMobileMenu();
          }}
          className="w-full justify-start gap-3 px-2 py-3 h-auto min-h-[44px] font-medium text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={20} className="flex-shrink-0 w-5 h-5" />
          {!isCollapsed && (
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              Logout
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
