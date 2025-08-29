import React, { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Inbox,
  Users,
  FileText,
  Settings,
  MessageSquare,
  User,
  ChevronDown,
  Building,
  Plus,
  Search,
  Bell,
  Calendar,
  Phone,
  Clock,
  CreditCard,
  Zap,
  Database,
  Share2,
  UserCog,
  Shield,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  expanded?: boolean;
  badge?: number;
  onClick?: () => void;
  href?: string;
}

const SidebarItem = ({ icon, label, active, expanded, badge, onClick, href }: SidebarItemProps) => {
  const content = (
    <div
      className={cn(
        "flex items-center py-2 px-3 rounded-md cursor-pointer text-sm transition-colors",
        active ? "bg-[#2a2a2a] text-white" : "text-gray-300 hover:bg-[#252525]"
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mr-3">{icon}</div>
      <span className="truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge className="ml-auto bg-red-500 text-white" variant="secondary">
          {badge}
        </Badge>
      )}
      {expanded !== undefined && (
        <ChevronDown
          className={cn("ml-auto h-4 w-4 transition-transform", expanded && "transform rotate-180")}
        />
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

interface SpruceLikeLayoutProps {
  children: ReactNode;
}

const SpruceLikeLayout: React.FC<SpruceLikeLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const [activeSection, setActiveSection] = useState("inbox");
  const [expandedInbox, setExpandedInbox] = useState(true);
  const [expandedContacts, setExpandedContacts] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>("organization-profile");

  // Determine which main section is active based on URL
  const pagePath = location.split("/")[1];

  // Data for left sidebar navigation
  const mainNavigation = [
    {
      id: "inbox",
      label: "Inbox",
      icon: <Inbox className="h-5 w-5" />,
      badge: 4,
      hasChildren: true,
    },
    {
      id: "team",
      label: "Team",
      icon: <Users className="h-5 w-5" />,
      badge: 0,
      hasChildren: false,
    },
    {
      id: "pages",
      label: "Pages",
      icon: <FileText className="h-5 w-5" />,
      badge: 0,
      hasChildren: false,
    },
    {
      id: "contacts",
      label: "Contacts",
      icon: <Users className="h-5 w-5" />,
      badge: 0,
      hasChildren: true,
    },
    {
      id: "scheduled",
      label: "Scheduled",
      icon: <Calendar className="h-5 w-5" />,
      badge: 0,
      hasChildren: false,
    },
    {
      id: "messages",
      label: "Bulk Messages",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: 0,
      hasChildren: false,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      badge: 0,
      hasChildren: false,
    },
  ];

  // Inbox subsections
  const inboxSubsections = [
    { id: "all", label: "All", count: 12 },
    { id: "assigned", label: "Assigned to Me", count: 5 },
    { id: "starred", label: "Starred", count: 3 },
    { id: "notes", label: "Notes", count: 0 },
    { id: "archived", label: "Archived", count: 0 },
  ];

  // Contacts subsections
  const contactsSubsections = [
    { id: "all", label: "All", count: 0 },
    { id: "patients", label: "Patients", count: 0 },
    { id: "patients-invited", label: "Patients Invited", count: 0 },
    { id: "patients-with-app", label: "Patients with app", count: 0 },
    { id: "unsaved-contacts", label: "Unsaved Contacts", count: 0 },
  ];

  // Settings menu items
  const organizationMenuItems = [
    {
      id: "organization-profile",
      label: "Organization Profile",
      icon: <Building className="h-5 w-5" />,
      href: "/settings/organization-profile",
    },
    {
      id: "organization-preferences",
      label: "Organization Preferences",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings/organization-preferences",
    },
    {
      id: "teammates",
      label: "Teammates",
      icon: <Users className="h-5 w-5" />,
      href: "/settings/teammates",
    },
    { id: "teams", label: "Teams", icon: <Users className="h-5 w-5" />, href: "/settings/teams" },
    {
      id: "billing",
      label: "Billing",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/settings/billing",
    },
    {
      id: "integrations",
      label: "Integrations & API",
      icon: <Zap className="h-5 w-5" />,
      href: "/settings/integrations",
    },
    {
      id: "data-exports",
      label: "Data Exports",
      icon: <Database className="h-5 w-5" />,
      href: "/settings/data-exports",
    },
    {
      id: "referral-program",
      label: "Referral Program",
      icon: <Share2 className="h-5 w-5" />,
      href: "/settings/referral-program",
    },
  ];

  const accountMenuItems = [
    {
      id: "profile",
      label: "Profile",
      icon: <UserCog className="h-5 w-5" />,
      href: "/settings/profile",
    },
    {
      id: "personal-preferences",
      label: "Personal Preferences",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings/personal-preferences",
    },
    {
      id: "call-settings",
      label: "My Call Settings",
      icon: <Phone className="h-5 w-5" />,
      href: "/settings/call-settings",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="h-5 w-5" />,
      href: "/settings/notifications",
    },
  ];

  const communicationMenuItems = [
    {
      id: "phone-system",
      label: "Phone System",
      icon: <Phone className="h-5 w-5" />,
      href: "/settings/phone-system",
    },
    {
      id: "secure-messaging",
      label: "Secure Messaging",
      icon: <Shield className="h-5 w-5" />,
      href: "/settings/secure-messaging",
    },
    { id: "fax", label: "Fax", icon: <FileText className="h-5 w-5" />, href: "/settings/fax" },
    { id: "email", label: "Email", icon: <Mail className="h-5 w-5" />, href: "/settings/email" },
    {
      id: "schedules",
      label: "Schedules",
      icon: <Clock className="h-5 w-5" />,
      href: "/settings/schedules",
    },
  ];

  return (
    <div className="flex h-screen bg-[#121212] text-white">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-[#333] flex flex-col">
        {/* New button */}
        <div className="p-3">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> New
          </Button>
        </div>

        {/* Main navigation */}
        <div className="overflow-y-auto flex-grow px-2 py-3">
          {mainNavigation.map((item) => (
            <div key={item.id} className="mb-1">
              <SidebarItem
                icon={item.icon}
                label={item.label}
                active={activeSection === item.id}
                expanded={
                  item.id === "inbox"
                    ? expandedInbox
                    : item.id === "contacts"
                      ? expandedContacts
                      : undefined
                }
                badge={item.badge}
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.id === "inbox" && item.hasChildren) {
                    setExpandedInbox(!expandedInbox);
                  } else if (item.id === "contacts" && item.hasChildren) {
                    setExpandedContacts(!expandedContacts);
                  }
                }}
              />

              {/* Inbox subsections */}
              {item.id === "inbox" && expandedInbox && (
                <div className="ml-8 mt-1 space-y-1">
                  {inboxSubsections.map((subsection) => (
                    <div
                      key={subsection.id}
                      className="flex items-center justify-between text-sm py-1 px-3 rounded-md hover:bg-[#252525] cursor-pointer text-gray-300"
                    >
                      <span>{subsection.label}</span>
                      {subsection.count > 0 && (
                        <span className="text-xs text-gray-400">{subsection.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Contacts subsections */}
              {item.id === "contacts" && expandedContacts && (
                <div className="ml-8 mt-1 space-y-1">
                  {contactsSubsections.map((subsection) => (
                    <div
                      key={subsection.id}
                      className="flex items-center justify-between text-sm py-1 px-3 rounded-md hover:bg-[#252525] cursor-pointer text-gray-300"
                    >
                      <span>{subsection.label}</span>
                      {subsection.count > 0 && (
                        <span className="text-xs text-gray-400">{subsection.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Middle Panel */}
      {activeSection === "settings" && (
        <div className="w-72 border-r border-[#333] bg-[#1a1a1a] overflow-y-auto">
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3">Centre Médical Font</h2>
              <div className="space-y-1">
                {organizationMenuItems.map((item) => (
                  <Link key={item.id} href={item.href}>
                    <Button
                      variant={activeMenu === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveMenu(item.id)}
                    >
                      {item.icon} <span className="ml-2">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            <Separator className="my-4 bg-[#333]" />

            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3">Account</h2>
              <div className="space-y-1">
                {accountMenuItems.map((item) => (
                  <Link key={item.id} href={item.href}>
                    <Button
                      variant={activeMenu === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveMenu(item.id)}
                    >
                      {item.icon} <span className="ml-2">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            <Separator className="my-4 bg-[#333]" />

            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3">Communication</h2>
              <div className="space-y-1">
                {communicationMenuItems.map((item) => (
                  <Link key={item.id} href={item.href}>
                    <Button
                      variant={activeMenu === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveMenu(item.id)}
                    >
                      {item.icon} <span className="ml-2">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-[#333] bg-[#1a1a1a] flex items-center px-4">
          <div className="flex-1 flex items-center">
            <h1 className="text-lg font-medium ml-2">
              {activeSection === "settings"
                ? "Settings"
                : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10 py-1 h-9 w-64 bg-[#252525] border-[#444] rounded-md text-sm"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-[#151515]">{children}</main>
      </div>
    </div>
  );
};

export default SpruceLikeLayout;
