import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { consumePostAuthRedirect } from "@/lib/auth";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (typeof window === "undefined") return;

      const currentUrl = new URL(window.location.href);
      const requestedNext =
        currentUrl.searchParams.get("next") ||
        consumePostAuthRedirect() ||
        "/doctor-dashboard";

      const next = requestedNext.startsWith("/") ? requestedNext : "/doctor-dashboard";

      const errorDescription = currentUrl.searchParams.get("error_description");
      if (errorDescription) {
        setError(decodeURIComponent(errorDescription));
        setProcessing(false);
        return;
      }

      const code = currentUrl.searchParams.get("code");
      if (!code) {
        setError("Missing authorization code. Please restart the sign-in flow.");
        setProcessing(false);
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setError(error.message);
        setProcessing(false);
        return;
      }

      navigate(next);
    };

    handleAuthCallback();
  }, [navigate]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] text-[#e6e6e6]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#8b5cf6]" />
          <p className="text-sm text-[#999]">
            Finalizing secure sign-in with Google&hellip;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] text-[#e6e6e6] px-4">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-semibold">Authentication Error</h1>
            <p className="text-sm text-[#999]">
              {error || "Something went wrong while processing your login."}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
            onClick={() => navigate("/doctor-login")}
          >
            Try Doctor Sign-in Again
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-[#333] text-[#e6e6e6] hover:bg-[#222]"
            onClick={() => navigate("/patient-login")}
          >
            Patient Sign-in
          </Button>
        </div>
      </div>
    </div>
  );
}
