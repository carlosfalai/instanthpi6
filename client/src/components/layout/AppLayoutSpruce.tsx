import React, { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Users,
  FileText,
  Settings,
  Home,
  User,
  Search,
  Bell,
  FilePlus2,
  ListTodo,
  Heart,
  PillIcon,
  AlertCircle,
  GraduationCap,
  CreditCard,
  LayoutList,
  Calendar,
  MessageSquare,
  Clock,
  Stethoscope,
  FileCheck,
  Brain,
  DollarSign,
  Plus,
  Menu,
  UserCog,
  ChevronDown,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  notificationCount?: number;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

// Define all notification counts
const notificationCounts = {
  inbox: 7,
  priorityAI: 4,
  patients: 12,
};

const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;

  return (
    <Badge
      variant="destructive"
      className="ml-auto text-xs min-w-[1.5rem] h-5 flex items-center justify-center rounded-full"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
};

interface AppLayoutSpruceProps {
  children: ReactNode;
}

export default function AppLayoutSpruce({ children }: AppLayoutSpruceProps) {
  const [location, navigate] = useLocation();

  // Define main navigation sections
  const mainNavSections: NavSection[] = [
    {
      id: "main",
      title: "Main",
      items: [
        { id: "home", label: "Home", path: "/", icon: Home },
        {
          id: "inbox",
          label: "Inbox",
          path: "/inbox",
          icon: MessageSquare,
          notificationCount: notificationCounts.inbox,
        },
        {
          id: "priorityAI",
          label: "Priority AI",
          path: "/priority-tasks",
          icon: BrainCircuit,
          notificationCount: notificationCounts.priorityAI,
        },
      ],
    },
    {
      id: "patients",
      title: "Patients",
      items: [
        {
          id: "patients",
          label: "Patients",
          path: "/patients",
          icon: Users,
          notificationCount: notificationCounts.patients,
        },
        {
          id: "chronicConditions",
          label: "Chronic Conditions",
          path: "/chronic-conditions",
          icon: Heart,
        },
        {
          id: "medicationRefills",
          label: "Medication Refills",
          path: "/medication-refills",
          icon: PillIcon,
        },
        { id: "urgentCare", label: "Urgent Care", path: "/urgent-care", icon: AlertCircle },
      ],
    },
    {
      id: "documents",
      title: "Documents",
      items: [
        { id: "documents", label: "Documents", path: "/documents", icon: FileText },
        {
          id: "insurancePaperwork",
          label: "Insurance Paperwork",
          path: "/insurance-paperwork",
          icon: FileCheck,
        },
      ],
    },
    {
      id: "tools",
      title: "Tools & AI",
      items: [
        {
          id: "knowledgeBase",
          label: "Knowledge Base",
          path: "/knowledge-base",
          icon: GraduationCap,
        },
        { id: "aiBilling", label: "AI Billing", path: "/ai-billing", icon: DollarSign },
        { id: "claudeAI", label: "Claude AI", path: "/claude-ai", icon: Brain },
      ],
    },
    {
      id: "tier35",
      title: "Tier 3.5 (The Association)",
      items: [
        { id: "association", label: "Association", path: "/tier-association", icon: UserCog },
      ],
    },
    {
      id: "leadership",
      title: "Leadership",
      items: [
        { id: "leadership", label: "Leadership", path: "/leadership-association", icon: UserCog },
      ],
    },
    {
      id: "settings",
      title: "Settings",
      items: [
        { id: "settings", label: "Settings", path: "/settings", icon: Settings },
        {
          id: "organizationProfile",
          label: "Organization Profile",
          path: "/organization-profile",
          icon: User,
        },
        { id: "teammates", label: "Teammates", path: "/teammates", icon: Users },
      ],
    },
  ];

  // Determine active section from path
  const determineActiveSection = () => {
    const pathSegment = location.split("/")[1] || "home";

    if (
      pathSegment === "settings" ||
      pathSegment === "organization-profile" ||
      pathSegment === "teammates"
    ) {
      return "settings";
    } else if (
      pathSegment === "patients" ||
      pathSegment === "chronic-conditions" ||
      pathSegment === "medication-refills" ||
      pathSegment === "urgent-care"
    ) {
      return "patients";
    } else if (pathSegment === "documents" || pathSegment === "insurance-paperwork") {
      return "documents";
    } else if (pathSegment === "knowledge-base") {
      return "knowledgeBase";
    } else if (pathSegment === "leadership-association") {
      return "leadership";
    } else if (pathSegment === "ai-billing") {
      return "aiBilling";
    } else if (pathSegment === "priority-tasks") {
      return "priorityAI";
    } else if (pathSegment === "claude-ai") {
      return "claudeAI";
    } else if (pathSegment === "tier-association") {
      return "association";
    } else if (pathSegment === "" || pathSegment === "home") {
      return "home";
    } else {
      const matchingSection = mainNavSections.find((section) =>
        section.items.some((item) => item.path.substring(1) === pathSegment)
      );
      return (
        matchingSection?.items.find((item) => item.path.substring(1) === pathSegment)?.id || "home"
      );
    }
  };

  const currentActiveSection = determineActiveSection();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex relative">
      {/* Background with subtle gradient */}
      <div className="absolute top-0 z-0 h-screen w-screen bg-gradient-to-br from-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:to-gray-800" />

      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 relative z-10">
        <div className="p-6">
          {/* Header with InstantHPI in Purple */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-purple-600">InstantHPI</span>
              <span className="text-sm text-muted-foreground">Centre Médical Font</span>
            </div>
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-6">
            {mainNavSections.map((section) => (
              <div key={section.id} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = currentActiveSection === item.id;
                    const Icon = item.icon;

                    return (
                      <Link key={item.id} href={item.path}>
                        <div
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{item.label}</span>
                          <NotificationBadge count={item.notificationCount || 0} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
