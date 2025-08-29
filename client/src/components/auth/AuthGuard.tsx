import { useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");
    const authTime = sessionStorage.getItem("authTime");

    // Check if authentication has expired (24 hours)
    if (authTime) {
      const authTimestamp = parseInt(authTime);
      const now = Date.now();
      const hoursSinceAuth = (now - authTimestamp) / (1000 * 60 * 60);

      if (hoursSinceAuth > 24) {
        // Session expired
        sessionStorage.removeItem("isAuthenticated");
        sessionStorage.removeItem("authTime");
        setLocation("/login");
        return;
      }
    }

    // Redirect to login if not authenticated and not already on login page
    if (!isAuthenticated && location !== "/login") {
      setLocation("/login");
    }
  }, [location, setLocation]);

  // Don't render children if not authenticated
  const isAuthenticated = sessionStorage.getItem("isAuthenticated");
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
