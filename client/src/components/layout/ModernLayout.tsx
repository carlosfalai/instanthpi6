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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface ModernLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showAura?: boolean;
}

const navItems = [
  { id: "home", label: "Dashboard", path: "/doctor-dashboard", icon: Home },
  { id: "patients", label: "Clients", path: "/patients", icon: Users, badge: 12 },
  { id: "messages", label: "Messages", path: "/messages", icon: MessageSquare, badge: 7 },
  { id: "documents", label: "Documents", path: "/documents", icon: FileText },
  { id: "inbox", label: "Inbox", path: "/inbox", icon: Mail, badge: 4 },
  { id: "ai", label: "AI Assistant", path: "/claude-ai", icon: Brain },
  { id: "settings", label: "Settings", path: "/doctor-profile", icon: Settings },
];

export default function ModernLayout({ children, title, description, showAura = true }: ModernLayoutProps) {
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
      {/* Cinematic Midnight Aura Effects */}
      {showAura && (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '-2s' }} />
        </>
      )}
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-border glass-dark backdrop-blur-xl">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-[#a0a0a0] hover:text-white transition-colors"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Link href="/doctor-dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary neon-glow-primary">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-black tracking-tight">InstantHPI</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" />
                <input
                  type="text"
                  placeholder="Search clients, documents..."
                  className="w-full rounded-xl border border-white/10 glass py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button className="p-2 text-[#a0a0a0] hover:text-white transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary neon-glow-primary"></span>
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary neon-glow-primary"></div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border glass-dark transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive
                      ? "bg-indigo-500/10 text-white border border-indigo-500/20"
                      : "text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white"
                      }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
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
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>

              <div className="rounded-xl glass p-3 border border-white/5">
                <p className="text-xs font-bold text-foreground">InstantHPI Elite</p>
                <p className="text-xs text-muted-foreground mt-1">Cinematic Midnight Theme</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {title && (
            <div className="border-b border-border glass-dark px-4 py-6 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
              {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
            </div>
          )}
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

