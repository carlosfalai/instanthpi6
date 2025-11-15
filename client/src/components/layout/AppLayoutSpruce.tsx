import React, { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import UnifiedLayout from "./UnifiedLayout";
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
    <span className="ml-auto inline-flex items-center justify-center w-5 h-5 bg-[#8b5cf6] rounded-full text-xs font-medium text-white">
      {count > 99 ? "99+" : count}
    </span>
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

  // Sidebar content
  const sidebarContent = (
    <div className="p-6 h-full">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#8b5cf6] rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#e6e6e6]">InstantHPI</h1>
            <p className="text-xs text-[#666]">Medical Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-6">
        {mainNavSections.map((section, idx) => (
          <div key={section.id} className={idx > 0 ? "border-t border-[#333] pt-6 mt-6" : ""}>
            <h3 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3 px-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = currentActiveSection === item.id;
                const Icon = item.icon;

                return (
                  <Link key={item.id} href={item.path}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#222] text-[#e6e6e6] border border-[#2a2a2a] font-medium"
                          : "text-[#999] hover:text-[#e6e6e6] hover:bg-[#222]/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
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
  );

  return (
    <UnifiedLayout navigationMode="sidebar" sidebarContent={sidebarContent} maxWidth="full">
      {children}
    </UnifiedLayout>
  );
}
