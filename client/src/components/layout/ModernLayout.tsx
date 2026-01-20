import React, { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Brain,
  Mail,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface ModernLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showAura?: boolean;
  hideSidebar?: boolean;
  noPadding?: boolean;
  fullHeight?: boolean;
}

const navItems = [
  { id: "home", label: "Dashboard", path: "/doctor-dashboard", icon: Home },
  { id: "command", label: "Command Center", path: "/command", icon: Users },
  { id: "messages", label: "Messages", path: "/messages", icon: MessageSquare },
  { id: "documents", label: "Documents", path: "/documents", icon: FileText },
  { id: "sms", label: "SMS Invitations", path: "/sms-invitations", icon: Mail },
  { id: "ai", label: "AI Assistant", path: "/claude-ai", icon: Brain },
  { id: "settings", label: "Settings", path: "/doctor-profile", icon: Settings },
];

export default function ModernLayout({
  children,
  title,
  description,
  showAura = true,
  hideSidebar = false,
  noPadding = false,
  fullHeight = false,
}: ModernLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("doctor_authenticated");
    localStorage.removeItem("doctor_info");
    setLocation("/doctor-login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Obsidian Precision Ambient Effects */}
      {showAura && (
        <>
          <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] animate-glow-pulse pointer-events-none" />
          <div
            className="fixed bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] animate-glow-pulse pointer-events-none"
            style={{ animationDelay: "-2s" }}
          />
        </>
      )}

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-border glass-dark">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {!hideSidebar && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              )}
              <Link href="/doctor-dashboard" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary amber-glow-primary">
                  <Sparkles className="h-5 w-5 text-background" />
                </div>
                <span
                  className="text-lg font-bold tracking-tight"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  InstantHPI
                </span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search clients, documents..."
                  className="w-full rounded-xl border border-border bg-card/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button className="p-2.5 text-muted-foreground hover:text-foreground transition-colors relative rounded-lg hover:bg-card/50">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary amber-glow-primary"></span>
              </button>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-secondary amber-glow-primary"></div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        {!hideSidebar && (
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border glass-dark transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col pt-16">
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary/10 text-foreground border border-primary/20"
                          : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge className="bg-primary/15 text-primary border-primary/25 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="border-t border-border p-4 space-y-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>

                <div className="rounded-xl glass p-3 border border-border/50">
                  <p
                    className="text-xs font-semibold text-foreground"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    InstantHPI Elite
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Obsidian Precision Theme</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Overlay for mobile */}
        {!hideSidebar && sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          className={`flex-1 lg:ml-0 ${fullHeight ? "h-[calc(100vh-64px)] overflow-hidden" : ""}`}
        >
          {title && (
            <div className="border-b border-border glass-dark px-4 py-6 sm:px-6 lg:px-8">
              <h1
                className="text-3xl font-bold tracking-tight text-foreground"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {title}
              </h1>
              {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
            </div>
          )}
          <div className={`${noPadding ? "" : "p-4 sm:p-6 lg:p-8"} ${fullHeight ? "h-full" : ""}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
