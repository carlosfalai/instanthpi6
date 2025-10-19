import React from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { hasLocalAuth, isSupabaseSessionFresh, logAuthDecision } from "@/lib/auth-utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    const startTime = performance.now();
    
    (async () => {
      try {
        const checkStartTime = performance.now();
        console.log(`[ProtectedRoute] Auth check starting at ${new Date().toISOString()}`);
        
        // Check URL query parameter first (for testing/debugging)
        const urlParams = new URLSearchParams(window.location.search);
        const authParam = urlParams.get('auth');
        const hasAuthParam = authParam === 'demo';
        console.log('[ProtectedRoute] URL auth parameter check:', { authParam, hasAuthParam });
        
        if (hasAuthParam) {
          console.log('[ProtectedRoute] ✓ Auth parameter found, setting isAuthed=true');
          logAuthDecision('url_param', { param: authParam });
          if (isMounted) {
            setDebugInfo({ 
              timestamp: new Date().toISOString(),
              result: 'URL_AUTH_PARAM_SUCCESS',
              authParam
            });
            setIsAuthed(true);
            setIsChecking(false);
          }
          return;
        }
        
        // Demo/local auth first (check BOTH localStorage and sessionStorage)
        const localAuth = hasLocalAuth();
        const checkTime1 = performance.now();
        
        const debugData = {
          timestamp: new Date().toISOString(),
          checkTime1Ms: (checkTime1 - checkStartTime).toFixed(2),
        };
        
        console.log('[ProtectedRoute] Local auth check:', { localAuth, timingMs: (checkTime1 - checkStartTime).toFixed(2) });
        
        if (localAuth) {
          console.log('[ProtectedRoute] ✓ Local auth found, setting isAuthed=true');
          logAuthDecision('local', { localStorage: true });
          if (isMounted) {
            setDebugInfo({ ...debugData, result: 'LOCAL_AUTH_SUCCESS' });
            setIsAuthed(true);
            setIsChecking(false);
          }
          return;
        }

        // Supabase session - only accept if fresh (less than 1 hour old)
        const checkTime2 = performance.now();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        const checkTime3 = performance.now();
        
        const hasSession = Boolean(session?.user);
        const isFresh = hasSession ? isSupabaseSessionFresh(session, 60) : false;
        
        debugData.supabaseCheckMs = (checkTime3 - checkTime2).toFixed(2);
        debugData.supabaseSessionExists = hasSession;
        debugData.supabaseSessionFresh = isFresh;
        debugData.supabaseUserEmail = session?.user?.email || 'none';
        debugData.supabaseError = sessionError?.message || 'none';
        
        console.log('[ProtectedRoute] Supabase session check:', { 
          hasSession,
          isFresh,
          userEmail: session?.user?.email,
          error: sessionError?.message,
          timingMs: (checkTime3 - checkTime2).toFixed(2)
        });
        
        if (isMounted) {
          setDebugInfo(debugData);
          setIsAuthed(isFresh);
          setIsChecking(false);
        }
        
        if (isFresh) {
          logAuthDecision('supabase', { email: session?.user?.email, fresh: true });
        } else if (hasSession) {
          logAuthDecision('supabase', { email: session?.user?.email, fresh: false, rejected: 'stale' });
        } else {
          logAuthDecision('none', { sessionError: sessionError?.message });
        }
      } catch (err: any) {
        const errorTime = performance.now();
        console.error('[ProtectedRoute] Auth guard check failed:', err);
        console.error('[ProtectedRoute] Error details:', {
          message: err?.message,
          stack: err?.stack,
          totalTimeMs: (errorTime - startTime).toFixed(2)
        });
        if (isMounted) {
          setDebugInfo(prev => ({
            ...prev,
            error: err?.message,
            result: 'ERROR',
            totalMs: (errorTime - startTime).toFixed(2)
          }));
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
          {debugInfo && (
            <div className="mt-4 text-xs text-[#666] max-w-xs bg-[#1a1a1a] p-2 rounded border border-[#333]">
              <p>Debug: {JSON.stringify(debugInfo, null, 2)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    console.log('[ProtectedRoute] Not authenticated, rendering auth required card');
    console.log('[ProtectedRoute] Debug info:', debugInfo);
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#e6e6e6] mb-2">Authentication required</h2>
          <p className="text-[#999] text-sm mb-4">
            Please sign in to access the medical dashboard.
          </p>
          {debugInfo && (
            <div className="mb-4 text-xs text-[#666] bg-[#0d0d0d] p-2 rounded border border-[#333] max-h-32 overflow-y-auto">
              <p className="font-mono">{JSON.stringify(debugInfo, null, 2)}</p>
            </div>
          )}
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

  console.log('[ProtectedRoute] ✓ Authenticated, rendering children');
  return <>{children}</>;
}


