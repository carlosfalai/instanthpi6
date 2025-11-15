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
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (typeof window === "undefined") return;

      const callbackStartTime = new Date().toISOString();
      console.log(`[AuthCallback] Starting at ${callbackStartTime}`);
      
      const currentUrl = new URL(window.location.href);
      
      // === DIAGNOSTICS: Log all URL parameters ===
      console.log('[AuthCallback] URL Parameters:', {
        fullUrl: window.location.href,
        hash: window.location.hash,
        search: window.location.search,
      });
      
      const params = Object.fromEntries(currentUrl.searchParams);
      console.log('[AuthCallback] All search params:', params);
      
      // === DIAGNOSTICS: Log Supabase client state ===
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      console.log('[AuthCallback] Supabase config loaded:', {
        urlSet: !!supabaseUrl,
        keySet: !!supabaseAnonKey,
        urlPrefix: supabaseUrl?.substring(0, 30) || 'MISSING',
        keyPrefix: supabaseAnonKey?.substring(0, 20) || 'MISSING',
      });

      const requestedNext =
        currentUrl.searchParams.get("next") ||
        consumePostAuthRedirect() ||
        "/doctor-dashboard";

      const next = requestedNext.startsWith("/") ? requestedNext : "/doctor-dashboard";
      console.log('[AuthCallback] Redirect destination:', { requestedNext, next });

      // === CHECK FOR ERROR FIRST ===
      const errorDescription = currentUrl.searchParams.get("error_description");
      if (errorDescription) {
        const errorMsg = decodeURIComponent(errorDescription);
        console.error('[AuthCallback] OAuth error detected:', errorMsg);
        setError(errorMsg);
        setDebugInfo({
          timestamp: callbackStartTime,
          step: 'error_detected',
          errorDescription: errorMsg,
          allParams: params,
        });
        setProcessing(false);
        return;
      }

      // === CHECK FOR TOKENS IN HASH FRAGMENT (PKCE/implicit flow) ===
      const hash = window.location.hash.substring(1); // Remove leading #
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const expiresAt = hashParams.get('expires_at');
      
      console.log('[AuthCallback] Hash fragment check:', {
        hashPresent: !!hash,
        accessTokenPresent: !!accessToken,
        refreshTokenPresent: !!refreshToken,
      });
      
      // If we have tokens in the hash, handle them directly
      if (accessToken) {
        console.log('[AuthCallback] Tokens found in hash fragment, processing...');
        try {
          // Supabase client with detectSessionInUrl: true should automatically process hash fragments
          // Wait a bit for Supabase to process the hash, then check for session
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check for session - Supabase should have processed the hash by now
          let { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          // If still no session, try refreshing to trigger hash processing
          if (!session && !sessionError) {
            console.log('[AuthCallback] No session yet, triggering auth state change...');
            // Trigger a refresh by calling getSession again after a short delay
            await new Promise(resolve => setTimeout(resolve, 500));
            const sessionResult = await supabase.auth.getSession();
            session = sessionResult.data?.session || null;
            sessionError = sessionResult.error || null;
          }
          
          if (sessionError) {
            console.error('[AuthCallback] Failed to get session from hash tokens:', sessionError);
            // If it's a JWT error, the token might be invalid - try manual setSession as fallback
            if (sessionError.message?.includes('JWT') || sessionError.message?.includes('Invalid')) {
              console.log('[AuthCallback] JWT error detected, attempting manual setSession...');
              try {
                const { data: { session: manualSession }, error: manualError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                });
                
                if (!manualError && manualSession) {
                  session = manualSession;
                  sessionError = null;
                }
              } catch (manualErr) {
                // Fall through to error handling
              }
            }
            
            if (sessionError) {
              setError(`Failed to process authentication: ${sessionError.message}`);
              setDebugInfo({
                timestamp: callbackStartTime,
                step: 'hash_token_error',
                errorMessage: sessionError.message,
              });
              setProcessing(false);
              return;
            }
          }
          
          if (session && session.user) {
            console.log('[AuthCallback] ✓ Session created from hash tokens', {
              userEmail: session.user?.email,
            });
            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            // Success - redirect
            console.log('[AuthCallback] Redirecting to:', next);
            navigate(next);
            return;
          } else {
            // Last resort: try to set session manually
            console.log('[AuthCallback] No session found, attempting manual setSession...');
            try {
              const { data: { session: newSession }, error: setError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (setError) {
                throw setError;
              }
              
              if (newSession && newSession.user) {
                console.log('[AuthCallback] ✓ Session set from hash tokens', {
                  userEmail: newSession.user?.email,
                });
                // Clear the hash from URL
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                navigate(next);
                return;
              } else {
                throw new Error('Session created but no user found');
              }
            } catch (setErr: any) {
              console.error('[AuthCallback] Failed to set session from hash tokens:', setErr);
              setError(`Failed to create session: ${setErr?.message || 'Unknown error'}`);
              setDebugInfo({
                timestamp: callbackStartTime,
                step: 'hash_set_session_error',
                errorMessage: setErr?.message,
                accessTokenPresent: !!accessToken,
                refreshTokenPresent: !!refreshToken,
              });
              setProcessing(false);
              return;
            }
          }
        } catch (err: any) {
          console.error('[AuthCallback] Error processing hash tokens:', err);
          setError(`Error processing authentication: ${err?.message || 'Unknown error'}`);
          setDebugInfo({
            timestamp: callbackStartTime,
            step: 'hash_processing_error',
            errorMessage: err?.message,
          });
          setProcessing(false);
          return;
        }
      }
      
      // === CHECK FOR AUTHORIZATION CODE (PKCE code exchange flow) ===
      const code = currentUrl.searchParams.get("code");
      console.log('[AuthCallback] Authorization code check:', {
        codePresent: !!code,
        codeLength: code?.length,
      });
      
      if (!code) {
        // Check if Supabase config is missing (most common issue)
        const isConfigMissing = !supabaseUrl || !supabaseAnonKey;
        
        let errorMessage = "Missing authorization code. ";
        let helpMessage = "";
        
        if (isConfigMissing) {
          errorMessage += "Supabase environment variables are not configured.";
          helpMessage = `This usually means VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing in Netlify.
          
To fix:
1. Go to Netlify Dashboard → Site Settings → Build & Deploy → Environment
2. Add: VITE_SUPABASE_URL = https://uoahrhroyqsqixusewwe.supabase.co
3. Add: VITE_SUPABASE_ANON_KEY = (your-anon-key)
4. Trigger a new deploy

Get your keys from: https://supabase.com/dashboard/project/uoahrhroyqsqixusewwe/settings/api`;
        } else {
          errorMessage += "OAuth redirect may not be configured correctly.";
          helpMessage = `Possible causes:
1. Redirect URI not registered in Supabase: ${window.location.origin}/auth/callback
2. Google OAuth not enabled in Supabase Dashboard
3. Domain mismatch in OAuth configuration

Check Supabase Dashboard → Authentication → URL Configuration`;
        }
        
        const debugMsg = `Missing authorization code.
        URL: ${window.location.href}
        Params: ${JSON.stringify(params)}
        Supabase Config: ${isConfigMissing ? 'MISSING' : 'PRESENT'}
        ${helpMessage}`;
        
        console.error('[AuthCallback] ' + debugMsg);
        setError(errorMessage);
        setDebugInfo({
          timestamp: callbackStartTime,
          step: 'no_code',
          allParams: params,
          origin: window.location.origin,
          redirectUri: `${window.location.origin}/auth/callback`,
          supabaseConfigPresent: !!(supabaseUrl && supabaseAnonKey),
          supabaseUrlPresent: !!supabaseUrl,
          supabaseKeyPresent: !!supabaseAnonKey,
          helpMessage,
          message: debugMsg,
        });
        setProcessing(false);
        return;
      }

      // === ATTEMPT SESSION EXCHANGE ===
      console.log('[AuthCallback] Attempting code exchange...');
      const exchangeStartTime = Date.now();
      
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        const exchangeTime = Date.now() - exchangeStartTime;
        
        if (error) {
          console.error('[AuthCallback] Code exchange failed:', {
            error: error.message,
            status: (error as any).status,
            cause: (error as any).cause,
            exchangeTimeMs: exchangeTime,
          });
          
          const errorMsg = error.message || 'Failed to exchange authorization code';
          setError(errorMsg);
          setDebugInfo({
            timestamp: callbackStartTime,
            step: 'exchange_failed',
            errorMessage: errorMsg,
            code: code.substring(0, 10) + '...',
            exchangeTimeMs: exchangeTime,
          });
          setProcessing(false);
          return;
        }
        
        console.log('[AuthCallback] ✓ Code exchange successful', {
          exchangeTimeMs: exchangeTime,
          sessionUser: data.session?.user?.email,
        });
        
        // === SUCCESS - REDIRECT ===
        console.log('[AuthCallback] Redirecting to:', next);
        navigate(next);
      } catch (err: any) {
        console.error('[AuthCallback] Unexpected error during exchange:', {
          error: err?.message,
          stack: err?.stack,
        });
        
        setError(`Unexpected error: ${err?.message || 'Unknown error'}`);
        setDebugInfo({
          timestamp: callbackStartTime,
          step: 'unexpected_error',
          errorMessage: err?.message,
          errorStack: err?.stack?.split('\n').slice(0, 3),
        });
        setProcessing(false);
      }
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
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-semibold">Authentication Error</h1>
            <p className="text-sm text-[#999]">
              {error || "Something went wrong while processing your login."}
            </p>
          </div>
        </div>

        {debugInfo && (
          <div className="bg-[#0d0d0d] border border-[#333] rounded p-3 max-h-48 overflow-y-auto">
            <p className="text-xs font-mono text-[#666] mb-2">Debug Info:</p>
            <pre className="text-xs text-[#999] whitespace-pre-wrap break-words">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
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
        
        <p className="text-xs text-[#666] text-center pt-2">
          Open browser console (F12) for detailed diagnostics
        </p>
      </div>
    </div>
  );
}
