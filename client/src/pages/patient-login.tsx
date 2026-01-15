import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { startGoogleLogin } from "@/lib/auth";
import { EliteLayout } from "@/components/elite/EliteLayout";
import { EliteCard } from "@/components/elite/EliteCard";
import { EliteInput } from "@/components/elite/EliteInput";
import { EliteButton } from "@/components/elite/EliteButton";
import { User, ArrowLeft, Lock, Mail, CheckCircle2 } from "lucide-react";

export default function PatientLogin() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/patient-dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      setMessage("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setMessage("");

      const { error } = await startGoogleLogin("/patient-dashboard");
      if (error) {
        setMessage(`Error: ${error}`);
        setLoading(false);
      }
    } catch (error) {
      setMessage("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <EliteLayout showAura={true}>
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">

        {/* Brand Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 neon-glow-primary border border-primary/20">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight mb-2">
            CLIENT PORTAL
          </h1>
          <p className="text-muted-foreground font-medium tracking-wide">
            SECURE ACCESS SYSTEM
          </p>
        </div>

        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

          {/* Login Form */}
          <EliteCard className="w-full max-w-md mx-auto relative overflow-hidden" glow>
            {/* Card Header */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground">Access Your Account</h2>
              <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <EliteInput
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <EliteInput
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {message && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {message}
                </div>
              )}

              <div className="space-y-4 pt-2">
                <EliteButton
                  className="w-full"
                  onClick={handleEmailLogin}
                  disabled={loading || !email || !password}
                >
                  {loading ? "Authenticating..." : "Secure Login"}
                </EliteButton>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#12110f] px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <EliteButton
                  variant="secondary"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                  </svg>
                  Google Access
                </EliteButton>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center justify-center mx-auto group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Return to Homepage
              </button>
            </div>
          </EliteCard>

          {/* Features Info (Visible on larger screens) */}
          <div className="hidden md:block space-y-8 p-6">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 neon-glow-primary">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Consultation Profile</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                    Manage your personal information and complete your intake profile securely.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 neon-glow-secondary">
                  <CheckCircle2 className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Follow-up Tracking</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                    Respond to follow-up questions and track your consultation status in real-time.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Secure Documents</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                    Access and generate encrypted documents shared by your consultant.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/20 backdrop-blur-sm">
              <p className="text-sm font-medium text-amber-200/90 italic">
                "Experience the future of consultation handling with our Elite platform."
              </p>
            </div>
          </div>

        </div>
      </div>
    </EliteLayout>
  );
}
