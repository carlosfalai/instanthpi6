/**
 * Consolidated Auth Utilities
 * Centralized auth logic for consistency across demo login, Supabase, and session management
 */

/**
 * Set demo/local auth credentials to both localStorage and sessionStorage
 * Ensures redundancy for auth state persistence
 */
export function setDemoAuth(email: string, name?: string, specialty?: string) {
  const timestamp = new Date().toISOString();
  console.log(`[AuthUtils] Setting demo auth at ${timestamp}`, { email });

  // Set auth flags
  localStorage.setItem("doctor_authenticated", "true");
  sessionStorage.setItem("doctor_authenticated", "true");

  // Set doctor info
  const doctorInfo = {
    email,
    name: name || "Doctor",
    specialty: specialty || "General Medicine",
    authType: "demo",
    timestamp,
  };

  localStorage.setItem("doctor_info", JSON.stringify(doctorInfo));
  sessionStorage.setItem("doctor_info", JSON.stringify(doctorInfo));

  // Verify both were set
  const verifyLocal = localStorage.getItem("doctor_authenticated");
  const verifySession = sessionStorage.getItem("doctor_authenticated");

  console.log("[AuthUtils] Auth flags verified:", {
    localStorage: verifyLocal === "true",
    sessionStorage: verifySession === "true",
    timestamp,
  });

  return verifyLocal === "true" && verifySession === "true";
}

/**
 * Check if user has local/demo authentication
 * Returns true if EITHER localStorage OR sessionStorage has auth flag
 */
export function hasLocalAuth(): boolean {
  const localAuthValue = localStorage.getItem("doctor_authenticated");
  const sessionAuthValue = sessionStorage.getItem("doctor_authenticated");
  return localAuthValue === "true" || sessionAuthValue === "true";
}

/**
 * Get local auth info if available
 */
export function getLocalAuthInfo() {
  const info = localStorage.getItem("doctor_info") || sessionStorage.getItem("doctor_info");
  if (info) {
    try {
      return JSON.parse(info);
    } catch (e) {
      console.error("[AuthUtils] Failed to parse doctor_info:", e);
      return null;
    }
  }
  return null;
}

/**
 * Clear all local auth data
 */
export function clearLocalAuth() {
  localStorage.removeItem("doctor_authenticated");
  sessionStorage.removeItem("doctor_authenticated");
  localStorage.removeItem("doctor_info");
  sessionStorage.removeItem("doctor_info");
  console.log("[AuthUtils] Local auth cleared");
}

/**
 * Check if a Supabase session is fresh (less than specified minutes old)
 * Prevents stale sessions from auto-redirecting
 */
export function isSupabaseSessionFresh(session: any, maxAgeMinutes: number = 60): boolean {
  if (!session?.user?.created_at) {
    return false;
  }

  const createdAt = new Date(session.user.created_at).getTime();
  const now = new Date().getTime();
  const ageMinutes = (now - createdAt) / (1000 * 60);

  return ageMinutes < maxAgeMinutes;
}

/**
 * Log auth decision for debugging
 */
export function logAuthDecision(
  source: "url_param" | "local" | "supabase" | "none",
  details?: any
) {
  console.log(`[AuthUtils] Auth decision: ${source}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}
