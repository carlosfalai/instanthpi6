import React, { useEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { LoginPage } from "@/components/auth/LoginPage";
import Landing from "@/pages/landing";
import DoctorDashboard from "@/pages/doctor-dashboard-new";
import DoctorLogin from "@/pages/doctor-login";
import DoctorProfileNew from "@/pages/doctor-profile-new";
import PatientLogin from "@/pages/patient-login";
import PatientDashboard from "@/pages/patient-dashboard";
import PublicPatientIntake from "@/pages/public-patient-intake";
import WebhookSetupPage from "@/pages/webhook-setup-page";
import PatientsPage from "@/pages/patients-page-new";
import DocumentsPage from "@/pages/documents-page";
import MessagesPage from "@/pages/messages-page";
import AIBillingPage from "@/pages/ai-billing-page";
import KnowledgeBasePage from "@/pages/knowledge-base-page";
import TierAssociationPage from "@/pages/tier-association-page";
import AuthCallback from "@/pages/auth-callback";
import { ProtectedRoute } from "@/lib/auth-guard";

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
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
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1a1a1a] border border-red-500/30 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-[#e6e6e6] mb-3">Application Error</h2>
            <p className="text-[#999] mb-6 text-sm break-words">{this.state.error?.message || 'An unknown error occurred'}</p>
            <a href="/doctor-login" className="inline-block bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-2 px-4 rounded-md">Back to Login</a>
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
        // Redirect based on the login page
        if (location === "/patient-login") {
          setLocation("/patient-dashboard");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location, setLocation]);

  return (
    <RootErrorBoundary>
      <Router>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/patient-intake" component={PublicPatientIntake} />
          <Route path="/patient-login" component={PatientLogin} />
          <Route path="/patient-dashboard" component={PatientDashboard} />
          <Route path="/login" component={LoginPage} />
          <Route path="/doctor-login" component={DoctorLogin} />
          <Route path="/doctor-dashboard">
            <ProtectedRoute>
              <DoctorDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/doctor-profile">
            <ProtectedRoute>
              <DoctorProfileNew />
            </ProtectedRoute>
          </Route>
          <Route path="/patients">
            <ProtectedRoute>
              <PatientsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/documents">
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/messages">
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          </Route>
          <Route path="/ai-billing">
            <ProtectedRoute>
              <AIBillingPage />
            </ProtectedRoute>
          </Route>
          <Route path="/knowledge-base">
            <ProtectedRoute>
              <KnowledgeBasePage />
            </ProtectedRoute>
          </Route>
          <Route path="/association">
            <ProtectedRoute>
              <TierAssociationPage />
            </ProtectedRoute>
          </Route>
          <Route path="/tier-35">
            <ProtectedRoute>
              <TierAssociationPage />
            </ProtectedRoute>
          </Route>
          <Route path="/auth/callback" component={AuthCallback} />
          <Route path="/webhook-setup" component={WebhookSetupPage} />
          <Route>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">404 - Page Not Found</h1>
                <a href="/" className="text-blue-500 hover:underline">
                  Go back home
                </a>
              </div>
            </div>
          </Route>
        </Switch>
      </Router>
    </RootErrorBoundary>
  );
}
