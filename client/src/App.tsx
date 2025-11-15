import React, { useEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { LoginPage } from "@/components/auth/LoginPage";
import Landing from "@/pages/landing";
import DoctorDashboard from "@/pages/doctor-dashboard-new";
import DoctorDashboardSimple from "@/pages/doctor-dashboard-simple";
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
import InboxPage from "@/pages/inbox-page";
import AuthCallback from "@/pages/auth-callback";
import LoginDiagnostics from "@/pages/login-diagnostics";
import SchedulerPage from "@/pages/scheduler-page";
import FormsitePage from "@/pages/formsite-page";
import FormsPage from "@/pages/forms-page";
import ChronicConditionsPage from "@/pages/chronic-conditions-page";
import MedicationRefillsPage from "@/pages/medication-refills-page";
import UrgentCarePage from "@/pages/urgent-care-page";
import EducationPage from "@/pages/education-page";
import SubscriptionPage from "@/pages/subscription-page";
import SettingsPage from "@/pages/settings-page";
import LeadershipAssociationPage from "@/pages/leadership-association-page";
import PrioritizedTasksPage from "@/pages/prioritized-tasks-page";
import InsurancePaperworkPage from "@/pages/insurance-paperwork-page";
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
    
    // Log to production monitoring (without sensitive data)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        // Send error to monitoring endpoint (if available)
        fetch('/api/error-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.message,
            stack: error.stack?.substring(0, 500), // Limit stack trace
            componentStack: info.componentStack?.substring(0, 500),
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 200)
          })
        }).catch(() => {
          // Silently fail if error logging endpoint is unavailable
        });
      } catch (e) {
        // Silently fail if error logging fails
      }
    }
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
            <p className="text-muted-foreground mb-6 text-sm break-words">{this.state.error?.message || 'An unknown error occurred'}</p>
            <a href="/doctor-login" className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md">Back to Login</a>
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
          <Route path="/login-diagnostics" component={LoginDiagnostics} />
          <Route path="/doctor-login" component={DoctorLogin} />
          <Route path="/doctor-dashboard">
            <ProtectedRoute>
              <DoctorDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/doctor-dashboard-simple" component={DoctorDashboardSimple} />
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
          <Route path="/inbox">
            <ProtectedRoute>
              <InboxPage />
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
          <Route path="/scheduler">
            <ProtectedRoute>
              <SchedulerPage />
            </ProtectedRoute>
          </Route>
          <Route path="/formsite">
            <ProtectedRoute>
              <FormsitePage />
            </ProtectedRoute>
          </Route>
          <Route path="/forms">
            <ProtectedRoute>
              <FormsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/chronic-conditions">
            <ProtectedRoute>
              <ChronicConditionsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/medication-refills">
            <ProtectedRoute>
              <MedicationRefillsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/urgent-care">
            <ProtectedRoute>
              <UrgentCarePage />
            </ProtectedRoute>
          </Route>
          <Route path="/education">
            <ProtectedRoute>
              <EducationPage />
            </ProtectedRoute>
          </Route>
          <Route path="/subscription">
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/leadership-association">
            <ProtectedRoute>
              <LeadershipAssociationPage />
            </ProtectedRoute>
          </Route>
          <Route path="/priority-tasks">
            <ProtectedRoute>
              <PrioritizedTasksPage />
            </ProtectedRoute>
          </Route>
          <Route path="/insurance-paperwork">
            <ProtectedRoute>
              <InsurancePaperworkPage />
            </ProtectedRoute>
          </Route>
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
