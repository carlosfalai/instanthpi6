import React, { useEffect, Suspense, lazy } from "react";
import { Router, Route, Switch, useLocation, Redirect } from "wouter";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/lib/auth-guard";

// Lazy load pages for code splitting
const DoctorLogin = lazy(() => import("@/pages/doctor-login"));
const AuthCallback = lazy(() => import("@/pages/auth-callback"));
const CommandCenter = lazy(() => import("@/pages/command-center"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0908]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-amber-500/70 text-sm">Loading...</span>
      </div>
    </div>
  );
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Root Error Boundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-destructive/30 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">Application Error</h2>
            <p className="text-muted-foreground mb-6 text-sm break-words">
              {this.state.error?.message || "An unknown error occurred"}
            </p>
            <a
              href="/login"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md"
            >
              Back to Login
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check auth state on mount
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Redirect to Command Center after login
        if (location === "/login" || location === "/doctor-login") {
          setLocation("/");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location, setLocation]);

  return (
    <RootErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Router>
          <Switch>
          {/* Main interface - Command Center */}
          <Route path="/">
            <ProtectedRoute>
              <CommandCenter />
            </ProtectedRoute>
          </Route>

          {/* Auth routes */}
          <Route path="/login" component={DoctorLogin} />
          <Route path="/doctor-login" component={DoctorLogin} />
          <Route path="/auth/callback" component={AuthCallback} />

          {/* Settings */}
          <Route path="/settings">
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          </Route>

          {/* Legacy redirects - all go to Command Center */}
          <Route path="/command">
            <Redirect to="/" />
          </Route>
          <Route path="/doctor-dashboard">
            <Redirect to="/" />
          </Route>
          <Route path="/inbox">
            <Redirect to="/" />
          </Route>
          <Route path="/messages">
            <Redirect to="/" />
          </Route>
          <Route path="/patients">
            <Redirect to="/" />
          </Route>
          <Route path="/documents">
            <Redirect to="/" />
          </Route>

          {/* 404 */}
          <Route>
            <div className="min-h-screen flex items-center justify-center bg-[#0a0908]">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2 text-white">404 - Page Not Found</h1>
                <a href="/" className="text-amber-500 hover:underline">
                  Go to Command Center
                </a>
              </div>
            </div>
          </Route>
          </Switch>
        </Router>
      </Suspense>
    </RootErrorBoundary>
  );
}
