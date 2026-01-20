import React, { ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import NavigationBar from "@/components/navigation/NavigationBar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UnifiedLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  navigationMode?: "top" | "sidebar";
  sidebarContent?: ReactNode;
}

export default function UnifiedLayout({
  children,
  showHeader = true,
  showFooter = false,
  maxWidth = "full",
  navigationMode = "top",
  sidebarContent,
}: UnifiedLayoutProps) {
  const [location, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/doctor-login");
  };

  const getInitials = (email?: string) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  };

  // Sidebar mode layout
  if (navigationMode === "sidebar") {
    return (
      <div className="min-h-screen flex bg-background text-foreground">
        {/* Sidebar */}
        {sidebarContent && (
          <aside className="w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0">
            {sidebarContent}
          </aside>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          {showHeader && (
            <header
              className={`h-16 flex items-center justify-between px-6 border-b ${
                scrolled
                  ? "bg-card/95 backdrop-blur-md shadow-lg border-border"
                  : "bg-card/90 backdrop-blur-sm border-sidebar-border"
              }`}
            >
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  InstantHPI
                </h1>
              </div>

              {user && (
                <div className="flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-accent">
                        <Avatar className="h-9 w-9 border-2 border-border">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                      <DropdownMenuLabel className="text-popover-foreground">
                        {user.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        onClick={() => navigate("/doctor-profile")}
                        className="text-popover-foreground hover:bg-accent cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/doctor-settings")}
                        className="text-popover-foreground hover:bg-accent cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-destructive hover:bg-accent cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </header>
          )}

          {/* Main Content */}
          <main
            className={`flex-1 overflow-auto ${maxWidthClasses[maxWidth]} w-full mx-auto px-4 sm:px-6 lg:px-8 py-6`}
          >
            {children}
          </main>

          {/* Footer */}
          {showFooter && (
            <footer className="mt-auto border-t border-sidebar-border bg-secondary py-6">
              <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8`}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                  <p>© {new Date().getFullYear()} InstantHPI. All rights reserved.</p>
                  <div className="flex gap-6">
                    <a href="#" className="hover:text-foreground transition-colors">
                      Privacy
                    </a>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Terms
                    </a>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Support
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>
    );
  }

  // Top navigation mode (default)
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      {showHeader && (
        <header
          className={`sticky top-0 z-50 h-16 flex items-center justify-between px-6 transition-all duration-300 ease-in-out border-b ${
            scrolled
              ? "bg-card/95 backdrop-blur-md shadow-lg border-border"
              : "bg-card/90 backdrop-blur-sm border-sidebar-border"
          }`}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              InstantHPI
            </h1>
          </div>

          {/* User Menu */}
          {user && (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-accent">
                    <Avatar className="h-9 w-9 border-2 border-border">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                  <DropdownMenuLabel className="text-popover-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={() => navigate("/doctor-profile")}
                    className="text-popover-foreground hover:bg-accent cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/doctor-settings")}
                    className="text-popover-foreground hover:bg-accent cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive hover:bg-accent cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </header>
      )}

      {/* Navigation Bar */}
      {showHeader && (
        <div className="sticky top-16 z-40 bg-secondary/95 backdrop-blur-sm border-b border-sidebar-border">
          <NavigationBar />
        </div>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 ${maxWidthClasses[maxWidth]} w-full mx-auto px-4 sm:px-6 lg:px-8 py-6`}
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="mt-auto border-t border-sidebar-border bg-secondary py-6">
          <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8`}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} InstantHPI. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
