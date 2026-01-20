import React from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  FileCode,
  Brain,
  DollarSign,
  LayoutList,
  Heart,
  PillIcon,
  Clock,
  GraduationCap,
  CreditCard,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface TopNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

// Individual navigation item
const TopNavItem: React.FC<TopNavItemProps> = ({ href, icon, label, isActive }) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex h-10 items-center gap-2 px-3 text-sm rounded-md transition-colors",
          isActive ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-[#2a2a2a]"
        )}
      >
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
};

const SpruceTopNavbar: React.FC = () => {
  const [location] = useLocation();
  const currentPath = location.split("/")[1] || "";

  // First row navigation items (exactly matching the screenshot)
  const primaryNavItems = [
    { href: "/", icon: <Home className="h-5 w-5" />, label: "Home" },
    { href: "/patients", icon: <Users className="h-5 w-5" />, label: "Patients" },
    { href: "/documents", icon: <FileText className="h-5 w-5" />, label: "Documents" },
    { href: "/messages", icon: <MessageSquare className="h-5 w-5" />, label: "Messages" },
    { href: "/scheduler", icon: <Calendar className="h-5 w-5" />, label: "Scheduler" },
    { href: "/formsite", icon: <FileCode className="h-5 w-5" />, label: "Formsite" },
    { href: "/knowledge-base", icon: <Brain className="h-5 w-5" />, label: "Knowledge Base" },
    { href: "/command", icon: <LayoutList className="h-5 w-5" />, label: "Command Center" },
  ];

  // Second row navigation items
  const secondaryNavItems = [
    { href: "/forms", icon: <LayoutList className="h-5 w-5" />, label: "Forms" },
    {
      href: "/chronic-conditions",
      icon: <Heart className="h-5 w-5" />,
      label: "Chronic Conditions",
    },
    {
      href: "/medication-refills",
      icon: <PillIcon className="h-5 w-5" />,
      label: "Medication Refills",
    },
    { href: "/urgent-care", icon: <Clock className="h-5 w-5" />, label: "Urgent Care" },
    { href: "/education", icon: <GraduationCap className="h-5 w-5" />, label: "Education" },
    { href: "/subscription", icon: <CreditCard className="h-5 w-5" />, label: "Subscription" },
    { href: "/settings", icon: <Settings className="h-5 w-5" />, label: "Organization Settings" },
  ];

  // Add a third row for Leadership Association
  const tertiaryNavItems = [
    {
      href: "/leadership-association",
      icon: <User className="h-5 w-5" />,
      label: "Leadership Association",
    },
  ];

  // Check if a path is active
  const isActiveLink = (href: string): boolean => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <header className="w-full bg-[#121212] border-b border-[#333]">
      <div className="flex flex-col">
        {/* App Logo */}
        <div className="px-4 py-3 flex items-center">
          <Link href="/">
            <a className="text-xl font-bold text-blue-500 tracking-tight">InstantHPI</a>
          </Link>
        </div>

        {/* First Row Navigation */}
        <div className="px-4 py-1 flex flex-wrap items-center space-x-1 overflow-x-auto scrollbar-hide">
          {primaryNavItems.map((item) => (
            <TopNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActiveLink(item.href)}
            />
          ))}
        </div>

        {/* Second Row Navigation */}
        <div className="px-4 py-1 flex flex-wrap items-center space-x-1 overflow-x-auto scrollbar-hide">
          {secondaryNavItems.map((item) => (
            <TopNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActiveLink(item.href)}
            />
          ))}
        </div>

        {/* Third Row Navigation */}
        <div className="px-4 py-1 flex flex-wrap items-center space-x-1 overflow-x-auto scrollbar-hide">
          {tertiaryNavItems.map((item) => (
            <TopNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActiveLink(item.href)}
            />
          ))}
        </div>

        {/* If on a specific page, show a page title bar */}
        {currentPath && (
          <div className="px-4 py-3 bg-[#121212] border-t border-[#333]">
            <h1 className="text-2xl font-bold text-blue-500">
              {currentPath === "scheduler"
                ? "AI Scheduler"
                : currentPath === "knowledge-base"
                  ? "Knowledge Base"
                  : currentPath === "chronic-conditions"
                    ? "Chronic Conditions"
                    : currentPath === "ai-billing"
                      ? "AI Billing"
                      : currentPath === "priority-tasks"
                        ? "Priority AI"
                        : currentPath === "leadership-association"
                          ? "Leadership Association"
                          : currentPath.charAt(0).toUpperCase() +
                            currentPath.slice(1).replace(/-/g, " ")}
            </h1>
          </div>
        )}
      </div>
    </header>
  );
};

export default SpruceTopNavbar;
