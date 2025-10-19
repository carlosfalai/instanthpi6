import React from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Demo/local auth first
        const localAuth = localStorage.getItem("doctor_authenticated") === "true";
        console.log('[ProtectedRoute] Local auth check:', { localAuth });
        if (localAuth) {
          if (isMounted) {
            console.log('[ProtectedRoute] Local auth found, setting isAuthed=true');
            setIsAuthed(true);
            setIsChecking(false);
          }
          return;
        }

        // Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const hasSession = Boolean(session?.user);
        console.log('[ProtectedRoute] Supabase session check:', { hasSession, userEmail: session?.user?.email });
        if (isMounted) {
          setIsAuthed(hasSession);
          setIsChecking(false);
        }
      } catch (err) {
        console.error('[ProtectedRoute] Auth guard check failed:', err);
        if (isMounted) {
          setIsAuthed(false);
          setIsChecking(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    console.log('[ProtectedRoute] Rendering skeleton (checking)');
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#333] border-t-[#8b5cf6] animate-spin mx-auto" />
          <p className="text-[#999] text-sm">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    console.log('[ProtectedRoute] Not authenticated, rendering auth required card');
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#e6e6e6] mb-2">Authentication required</h2>
          <p className="text-[#999] text-sm mb-4">
            Please sign in to access the medical dashboard.
          </p>
          <button
            className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-2 rounded-md"
            onClick={() => navigate("/doctor-login")}
          >
            Go to Doctor Login
          </button>
        </div>
      </div>
    );
  }

  console.log('[ProtectedRoute] Authenticated, rendering children');
  return <>{children}</>;
}


