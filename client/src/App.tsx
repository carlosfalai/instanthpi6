import React, { useEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { LoginPage } from "@/components/auth/LoginPage";
import Landing from "@/pages/landing";
import DoctorDashboard from "@/pages/doctor-dashboard";
import DoctorLogin from "@/pages/doctor-login";
import DoctorProfileNew from "@/pages/doctor-profile-new";
import PatientLogin from "@/pages/patient-login";
import PatientDashboard from "@/pages/patient-dashboard";
import PublicPatientIntake from "@/pages/public-patient-intake";
import WebhookSetupPage from "@/pages/webhook-setup-page";

export default function App() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check auth state on mount
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Redirect based on the login page
        if (location === "/login") {
          setLocation("/doctor-dashboard");
        } else if (location === "/patient-login") {
          setLocation("/patient-dashboard");
        }
      } else if (event === "SIGNED_OUT") {
        // Redirect to landing page on logout
        setLocation("/");
      }
    });
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
