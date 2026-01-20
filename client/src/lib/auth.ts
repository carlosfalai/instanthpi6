import { supabase } from "./supabase";

const POST_AUTH_REDIRECT_KEY = "instanthpi_post_auth_redirect";

export function rememberPostAuthRedirect(path: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

export function consumePostAuthRedirect(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const path = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
    if (path) {
      sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      return path;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

/**
 * Diagnose OAuth configuration issues before attempting login
 */
function diagnoseOAuthConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const origin = typeof window !== "undefined" ? window.location.origin : "SERVER";

  const diagnosis = {
    timestamp: new Date().toISOString(),
    supabaseUrlPresent: !!supabaseUrl,
    supabaseUrlValid: supabaseUrl?.startsWith("https://"),
    supabaseAnonKeyPresent: !!supabaseAnonKey,
    supabaseAnonKeyValid: (supabaseAnonKey?.length || 0) > 50,
    origin,
    redirectUri: `${origin}/auth/callback`,
  };

  const issues = [];
  if (!supabaseUrl) issues.push("VITE_SUPABASE_URL environment variable is missing");
  if (supabaseUrl && !supabaseUrl.startsWith("https://"))
    issues.push("VITE_SUPABASE_URL is not a valid HTTPS URL");
  if (!supabaseAnonKey) issues.push("VITE_SUPABASE_ANON_KEY environment variable is missing");
  if (supabaseAnonKey && supabaseAnonKey.length < 50)
    issues.push("VITE_SUPABASE_ANON_KEY appears too short - may be invalid");

  if (issues.length > 0) {
    console.warn("[Auth] OAuth configuration issues detected:", issues);
    console.warn("[Auth] Config state:", diagnosis);
  }

  return { diagnosis, issues };
}

export async function startGoogleLogin(nextPath: string) {
  if (typeof window === "undefined") {
    return { error: "Google sign-in is only available in the browser." };
  }

  console.log("[Auth] Starting Google login flow for path:", nextPath);

  // Run diagnostics
  const { diagnosis, issues } = diagnoseOAuthConfig();
  console.log("[Auth] Pre-OAuth diagnostics:", { diagnosis, issues });

  rememberPostAuthRedirect(nextPath);

  try {
    const redirectUri = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    console.log("[Auth] OAuth configuration:", {
      provider: "google",
      redirectUri,
      scope: "openid email profile",
      timestamp: new Date().toISOString(),
    });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        scopes: "openid email profile",
      },
    });

    if (error) {
      let errorMsg = error.message || "Google sign-in failed. Please try again.";

      // Check for specific OAuth configuration errors
      if (error.message?.includes("client_id") || error.message?.includes("invalid_request")) {
        const supabaseUrl =
          import.meta.env.VITE_SUPABASE_URL || "https://gbxksgxezbljwlnlpkpz.supabase.co";
        errorMsg =
          "Google OAuth is not configured in Supabase. Please configure Google OAuth in the Supabase Dashboard:\n\n" +
          "1. Go to Supabase Dashboard → Authentication → Providers → Google\n" +
          "2. Enable Google provider\n" +
          "3. Add your Google OAuth Client ID and Client Secret\n" +
          "4. Save the configuration\n\n" +
          "Also verify in Google Cloud Console that the redirect URI is set:\n" +
          `${supabaseUrl}/auth/v1/callback`;
      }

      console.error("[Auth] signInWithOAuth error:", {
        message: error.message,
        status: (error as any).status,
        cause: (error as any).cause,
      });

      if (issues.length > 0) {
        console.error("[Auth] Configuration issues may be the cause:", issues);
      }

      return { error: errorMsg };
    }

    console.log("[Auth] ✓ OAuth redirect initiated successfully");
    return { error: null };
  } catch (error: any) {
    const errorMsg = error?.message || "Google sign-in failed. Please try again.";
    console.error("[Auth] Unexpected error during OAuth:", {
      message: error?.message,
      stack: error?.stack?.split("\n").slice(0, 3),
    });

    if (issues.length > 0) {
      console.error("[Auth] Configuration issues detected:", issues);
    }

    return { error: errorMsg };
  }
}
