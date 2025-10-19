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
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Failed to fetch session", error.message);
        return;
      }

      if (session) {
        navigate("/doctor-dashboard");
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
        // Set a session flag
        localStorage.setItem("doctor_authenticated", "true");
        localStorage.setItem("doctor_info", JSON.stringify({
          email: email,
          name: "Doctor",
          specialty: "General Medicine"
        }));
        // Add a small delay to ensure localStorage is set
        setTimeout(() => {
          navigate("/doctor-dashboard");
        }, 100);
      } else {
        setMessage("Invalid credentials. Use doctor@instanthpi.ca / medical123");
      }
    } catch (error: any) {
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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Medical Dashboard</CardTitle>
          <CardDescription className="text-center">
            Access the InstantHPI Medical Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Google Sign-in Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-6 bg-[#1a1a1a] hover:bg-[#222] text-[#e6e6e6] border border-[#333] rounded-md shadow-sm"
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
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1a1a1a] px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#e6e6e6]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@instanthpi.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666] focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#e6e6e6]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0d0d0d] border-[#333] text-[#e6e6e6] placeholder:text-[#666] focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

            </form>

            {message && (
              <div className="p-3 rounded-md text-sm bg-amber-50 text-amber-800 mt-4">
                {message}
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-4">
              Secure authentication for healthcare professionals
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
