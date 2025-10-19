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

export default function App() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check auth state on mount
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Redirect based on the login page
        if (location === "/doctor-login") {
          setLocation("/doctor-dashboard");
        } else if (location === "/patient-login") {
          setLocation("/patient-dashboard");
        }
      } else if (event === "SIGNED_OUT") {
        // Redirect to landing page on logout
        setLocation("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location, setLocation]);

  return (
    <Router>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/patient-intake" component={PublicPatientIntake} />
        <Route path="/patient-login" component={PatientLogin} />
        <Route path="/patient-dashboard" component={PatientDashboard} />
        <Route path="/login" component={LoginPage} />
        <Route path="/doctor-login" component={DoctorLogin} />
        <Route path="/doctor-dashboard" component={DoctorDashboard} />
        <Route path="/doctor-profile" component={DoctorProfileNew} />
        <Route path="/patients" component={PatientsPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/ai-billing" component={AIBillingPage} />
        <Route path="/knowledge-base" component={KnowledgeBasePage} />
        <Route path="/association" component={TierAssociationPage} />
        <Route path="/tier-35" component={TierAssociationPage} />
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
  );
}
