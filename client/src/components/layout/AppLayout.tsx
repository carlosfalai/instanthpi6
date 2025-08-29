import React, { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Users,
  FileText,
  Calendar,
  Settings,
  Search,
  Bell,
  MessageSquare,
  User,
  ClipboardList,
  Heart,
  PillIcon,
  AlertCircle,
  GraduationCap,
  CreditCard,
  BookOpen,
  Receipt,
  FormInput,
  UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { User as UserType } from "@shared/schema";

interface AppLayoutProps {
  children: ReactNode;
}

// Badge component for notification counts
const NotificationBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;

  return (
    <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
      {count > 99 ? "99+" : count}
    </div>
  );
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  // Fetch notification counts
  const { data: notificationCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/notifications/counts"],
  });

  // Fetch current user data
  const { data: currentUser } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  // Generate initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Navigation items - matching the tree structure in screenshot
  const primaryNavItems = [
    { id: "home", path: "/", icon: <Home className="h-5 w-5" />, label: "Home", badge: 0 },
    {
      id: "patients",
      path: "/patients",
      icon: <Users className="h-5 w-5" />,
      label: "Patients",
      badge: notificationCounts.patients || 0,
    },
    {
      id: "documents",
      path: "/documents",
      icon: <FileText className="h-5 w-5" />,
      label: "Documents",
      badge: notificationCounts.documents || 0,
    },
    {
      id: "messages",
      path: "/messages",
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Messages",
      badge: 0,
    },
    {
      id: "scheduler",
      path: "/scheduler",
      icon: <Calendar className="h-5 w-5" />,
      label: "Scheduler",
      badge: 0,
    },
    {
      id: "formsite",
      path: "/formsite",
      icon: <FormInput className="h-5 w-5" />,
      label: "formsite",
      badge: 0,
    },
    {
      id: "knowledgeBase",
      path: "/knowledge-base",
      icon: <BookOpen className="h-5 w-5" />,
      label: "Knowledge Base",
      badge: 0,
    },
    {
      id: "aiBilling",
      path: "/ai-billing",
      icon: <Receipt className="h-5 w-5" />,
      label: "AI Billing",
      badge: 0,
    },
  ];

  const secondaryNavItems = [
    {
      id: "forms",
      path: "/forms",
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Forms",
      badge: 0,
    },
    {
      id: "chronicConditions",
      path: "/chronic-conditions",
      icon: <Heart className="h-5 w-5" />,
      label: "Chronic Conditions",
      badge: notificationCounts.chronicConditions || 0,
    },
    {
      id: "medicationRefills",
      path: "/medication-refills",
      icon: <PillIcon className="h-5 w-5" />,
      label: "Medication Refills",
      badge: notificationCounts.medicationRefills || 0,
    },
    {
      id: "urgentCare",
      path: "/urgent-care",
      icon: <AlertCircle className="h-5 w-5" />,
      label: "Urgent Care",
      badge: notificationCounts.urgentCare || 0,
    },
    {
      id: "education",
      path: "/education",
      icon: <GraduationCap className="h-5 w-5" />,
      label: "Education",
      badge: 0,
    },
    {
      id: "subscription",
      path: "/subscription",
      icon: <CreditCard className="h-5 w-5" />,
      label: "Subscription",
      badge: 0,
    },
    {
      id: "settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Organization Settings",
      badge: 0,
    },
  ];

  const tertiaryNavItems = [
    {
      id: "leadershipAssociation",
      path: "/leadership-association",
      icon: <UserIcon className="h-5 w-5" />,
      label: "Leadership Association",
      badge: 0,
    },
  ];

  // Render navigation item
  const renderNavItem = (item: (typeof primaryNavItems)[0], active: boolean) => (
    <Link
      key={item.id}
      href={item.path}
      className={cn(
        "relative flex items-center p-2 px-3 text-sm rounded-md transition-colors",
        active
          ? "bg-blue-600 text-white font-medium shadow-sm"
          : "text-gray-200 bg-[#2a2a2a] hover:bg-[#333333] shadow-sm",
        "min-w-fit mr-2 my-1"
      )}
    >
      <div className="relative mr-2">
        {item.icon}
        {item.badge > 0 && <NotificationBadge count={item.badge} />}
      </div>
      <span className="truncate">{item.label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Header */}
      <header className="h-14 flex items-center px-4 bg-[#1e1e1e] border-b border-gray-800 fixed top-0 left-0 right-0 z-50">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          InstantHPI
        </h1>

        <div className="ml-auto flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 py-1 h-9 w-64 bg-[#252525] border-[#444] rounded-md text-sm"
            />
          </div>
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-300 cursor-pointer" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={currentUser?.fullName || "User"} />
            <AvatarFallback className="bg-indigo-700">
              {getInitials(currentUser?.fullName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Navigation Bar - First row */}
      <nav className="w-full bg-[#1a1a1a] border-b border-gray-800 py-1 sticky top-14 z-40 mt-14">
        {/* Primary Nav Row - Must be visible */}
        <div className="flex items-center px-4 mb-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 py-2">
          <div className="flex items-center space-x-2">
            {primaryNavItems.map((item) => (
              <div key={item.id} className="flex-shrink-0">
                {renderNavItem(item, location === item.path)}
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Nav Row */}
        <div className="flex items-center px-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 py-2 border-t border-gray-800">
          <div className="flex items-center space-x-2">
            {secondaryNavItems.map((item) => (
              <div key={item.id} className="flex-shrink-0">
                {renderNavItem(item, location === item.path)}
              </div>
            ))}
          </div>
        </div>

        {/* Tertiary Nav Row */}
        {tertiaryNavItems.length > 0 && (
          <div className="flex items-center px-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 py-2 border-t border-gray-800">
            <div className="flex items-center space-x-2">
              {tertiaryNavItems.map((item) => (
                <div key={item.id} className="flex-shrink-0">
                  {renderNavItem(item, location === item.path)}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
