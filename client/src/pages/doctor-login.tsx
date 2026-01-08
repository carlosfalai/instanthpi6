import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { startGoogleLogin } from "@/lib/auth";
import { Sparkles } from "lucide-react";

export default function DoctorLogin() {
  const [, navigate] = useLocation();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Check if running locally (development mode)
  const isLocalDev = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    import.meta.env.DEV;

  useEffect(() => {
    // For local development, bypass login and go straight to dashboard
    if (isLocalDev) {
      console.log('Local development mode detected - bypassing authentication');
      // Set local auth flag for ProtectedRoute
      localStorage.setItem('doctor_authenticated', 'true');
      localStorage.setItem('doctor_info', JSON.stringify({
        name: 'Carlos Faviel Font',
        email: 'cff@centremedicalfont.ca',
        specialty: 'Médecine Générale'
      }));
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/doctor-dashboard');
      }, 100);
      return;
    }

    // Production: Check Supabase session - but DON'T auto-redirect from login page
    // Users must explicitly click "Sign in" button for security
    // Only show a message if they're already logged in
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Failed to fetch session", error.message);
          return;
        }

        if (session && session.user) {
          // Check if session is valid
          const now = Math.floor(Date.now() / 1000);

          // Only show message if session is valid - but don't auto-redirect
          if (session.expires_at && session.expires_at > now) {
            setMessage("You are already signed in. Click 'Continue' to go to dashboard or sign out to use a different account.");
          } else if (session.expires_at) {
            // Session expired - try refresh silently, but don't auto-redirect
            const expiredBy = now - session.expires_at;
            if (expiredBy < 300) { // Within 5 minutes
              console.log('[DoctorLogin] Session expired, attempting refresh...');
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

              if (!refreshError && refreshedSession?.user && refreshedSession.expires_at) {
                const newExpiresAt = refreshedSession.expires_at;
                if (newExpiresAt > now) {
                  setMessage("Session refreshed. Click 'Continue' to go to dashboard.");
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    checkSession();
  }, [navigate, isLocalDev]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setMessage("");
    const { error } = await startGoogleLogin("/doctor-dashboard");
    if (error) {
      setMessage(error);
      setGoogleLoading(false);
    }
  };

  // In local dev, show a loading message while redirecting
  if (isLocalDev) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-glow-pulse pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" style={{ animationDelay: '-2s' }} />

        <Card className="w-full max-w-md glass-dark border-border shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-muted-foreground font-medium">Development mode - Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient Glow Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-glow-pulse pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" style={{ animationDelay: '-2s' }} />

      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(245, 158, 11, 0.5) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(245, 158, 11, 0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo & Brand */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary amber-glow-primary mb-6">
            <Sparkles className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
            InstantHPI
          </h1>
          <p className="text-muted-foreground mt-2">
            Consultant Dashboard
          </p>
        </div>

        <Card className="glass-dark border-border/50 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Sign in to access the InstantConsult SaaS Platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && message.toLowerCase().includes("already signed") && (
              <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <span className="text-sm text-foreground/90">You are already signed in.</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-background font-semibold amber-glow-primary"
                    onClick={() => navigate("/doctor-dashboard")}
                  >
                    Continue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-border/50 bg-transparent hover:bg-card text-foreground"
                    onClick={async () => {
                      try {
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
              className="w-full flex items-center justify-center gap-3 py-6 bg-card hover:bg-card/80 text-foreground border border-border/50 rounded-xl shadow-lg transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
              variant="outline"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span className="font-medium">
                {googleLoading ? "Redirecting to Google..." : "Sign in with Google"}
              </span>
            </Button>

            {message && !message.toLowerCase().includes("already signed") && (
              <div className={`p-4 rounded-xl text-sm whitespace-pre-line ${message.includes("error") || message.includes("failed") || message.includes("not configured")
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-primary/10 text-primary border border-primary/20"
                }`}>
                {message}
                {message.includes("not configured") && (
                  <div className="mt-3 pt-3 border-t border-destructive/30">
                    <p className="font-semibold mb-2">Quick Fix:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs opacity-90">
                      <li>Go to <a href="https://supabase.com/dashboard/project/gbxksgxezbljwlnlpkpz/auth/providers" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Supabase Dashboard → Auth → Providers</a></li>
                      <li>Click on "Google" provider</li>
                      <li>Enable it and add your Google OAuth credentials</li>
                      <li>Get credentials from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Google Cloud Console</a></li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-muted-foreground/60 text-xs mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          &copy; {new Date().getFullYear()} InstantHPI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
