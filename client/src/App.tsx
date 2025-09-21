import React, { useEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { LoginPage } from "@/components/auth/LoginPage";
import DoctorDashboard from "@/pages/doctor-dashboard";
import DoctorLogin from "@/pages/doctor-login";
import DoctorProfile from "@/pages/doctor-profile";
import PublicPatientIntake from "@/pages/public-patient-intake";
import WebhookSetupPage from "@/pages/webhook-setup-page";

export default function App() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check auth state on mount
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Redirect to doctor dashboard on successful login
        if (location === "/login") {
          setLocation("/doctor-dashboard");
        }
      } else if (event === "SIGNED_OUT") {
        // Redirect to intake form on logout
        setLocation("/");
      }
    });
  }, [location, setLocation]);

  return (
    <Router>
      <Switch>
        <Route path="/" component={PublicPatientIntake} />
        <Route path="/login" component={LoginPage} />
        <Route path="/doctor-login" component={DoctorLogin} />
        <Route path="/doctor-dashboard" component={DoctorDashboard} />
        <Route path="/doctor-profile" component={DoctorProfile} />
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
