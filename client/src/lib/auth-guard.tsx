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
        if (localAuth) {
          if (isMounted) {
            setIsAuthed(true);
            setIsChecking(false);
          }
          return;
        }

        // Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (isMounted) {
          setIsAuthed(Boolean(session?.user));
          setIsChecking(false);
        }
      } catch (err) {
        console.error("Auth guard check failed:", err);
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

  return <>{children}</>;
}


