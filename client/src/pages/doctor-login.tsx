import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { startGoogleLogin } from "@/lib/auth";

export default function DoctorLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      // Check localStorage FIRST (demo login has priority)
      const isLocalAuth = localStorage.getItem("doctor_authenticated") === "true";
      if (isLocalAuth) {
        // Already logged in via demo - show banner, do not auto-redirect
        setMessage("You are already signed in. Continue to dashboard or sign out.");
        return;
      }

      // Only check Supabase for VALID OAuth sessions
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Failed to fetch session", error.message);
          return;
        }

        // Only show banner if we have a valid Supabase session
        // AND it hasn't been more than 1 hour (session is fresh)
        if (session && session.user) {
          const sessionAge = Date.now() - (session.created_at ? new Date(session.created_at).getTime() : 0);
          const oneHour = 60 * 60 * 1000;
          
          if (sessionAge < oneHour) {
            // Fresh OAuth session - show banner, do not auto-redirect
            setMessage("You are already signed in. Continue to dashboard or sign out.");
          } else {
            // Stale session - allow user to login again
            console.log("Stale Supabase session detected, showing login form");
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
        // Show login form if check fails
      }
    };

    checkSession();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setMessage("");
    const { error } = await startGoogleLogin("/doctor-dashboard");
    if (error) {
      setMessage(error);
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // For demo purposes, using a simple check
      // In production, this would be a proper authentication
      if (email === "doctor@instanthpi.ca" && password === "medical123") {
        const loginTime = new Date().toISOString();
        console.log(`[DoctorLogin] Demo login successful at ${loginTime}`);
        
        // Set a session flag
        localStorage.setItem("doctor_authenticated", "true");
        const verifyAuth = localStorage.getItem("doctor_authenticated");
        console.log('[DoctorLogin] localStorage.setItem("doctor_authenticated", "true")', {
          wasSet: verifyAuth === "true",
          storedValue: verifyAuth,
          timestamp: loginTime
        });
        
        localStorage.setItem("doctor_info", JSON.stringify({
          email: email,
          name: "Doctor",
          specialty: "General Medicine"
        }));
        const verifyInfo = localStorage.getItem("doctor_info");
        console.log('[DoctorLogin] localStorage.setItem("doctor_info", ...)', {
          wasSet: Boolean(verifyInfo),
          timestamp: loginTime
        });
        
        console.log('[DoctorLogin] Navigating to /doctor-dashboard in 100ms');
        // Add a small delay to ensure localStorage is set
        setTimeout(() => {
          console.log('[DoctorLogin] Executing navigation callback');
          const preNavAuth = localStorage.getItem("doctor_authenticated");
          console.log('[DoctorLogin] Pre-navigation localStorage check:', { preNavAuth });
          navigate("/doctor-dashboard");
        }, 100);
      } else {
        setMessage("Invalid credentials. Use doctor@instanthpi.ca / medical123");
      }
    } catch (error: any) {
      console.error('[DoctorLogin] Login error:', error);
      setMessage("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Light purple gradient matching the profile page
  const backgroundImages = [
    "bg-gradient-to-br from-purple-50 to-violet-100",
    "bg-gradient-to-br from-purple-50 to-indigo-100",
    "bg-gradient-to-br from-violet-50 to-purple-100",
    "bg-gradient-to-br from-indigo-50 to-purple-100",
    "bg-gradient-to-br from-purple-100 to-violet-200"
  ];
  
  const [currentBg, setCurrentBg] = React.useState(() => 
    backgroundImages[Math.floor(Math.random() * backgroundImages.length)]
  );

  // Rotate background on each page load
  React.useEffect(() => {
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    setCurrentBg(backgroundImages[randomIndex]);
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center ${currentBg}`}>
      <Card className="w-full max-w-md bg-white shadow-xl border-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gray-900">Medical Dashboard</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Access the InstantHPI Medical Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {message && message.toLowerCase().includes("already signed") && (
              <div className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <span className="text-sm">You are already signed in.</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => navigate("/doctor-dashboard")}
                  >
                    Continue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300"
                    onClick={async () => {
                      try {
                        localStorage.removeItem("doctor_authenticated");
                        localStorage.removeItem("doctor_info");
                        await supabase.auth.signOut();
                        setMessage("");
                      } catch (e) {
                        console.error("Sign out failed", e);
                      }
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            )}
            {/* Google Sign-in Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-6 !bg-white hover:!bg-gray-50 !text-gray-900 !border !border-gray-300 rounded-md shadow-sm"
              variant="outline"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? "Redirecting to Google..." : "Sign in with Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@instanthpi.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="!bg-white !border-gray-300 !text-gray-900 !placeholder:text-gray-400 focus:!ring-purple-500 focus:!border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="!bg-white !border-gray-300 !text-gray-900 !placeholder:text-gray-400 focus:!ring-purple-500 focus:!border-purple-500"
                />
              </div>

              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes("Invalid") 
                    ? "bg-red-50 text-red-800 border border-red-200" 
                    : "bg-green-50 text-green-800 border border-green-200"
                }`}>
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              <p>Demo Credentials:</p>
              <p className="font-mono text-xs mt-1">doctor@instanthpi.ca / medical123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
