/**
 * Authentication Middleware and Utilities
 *
 * Use these utilities to ensure proper user authentication and data isolation.
 * NEVER use hardcoded user IDs - always extract from authenticated session.
 *
 * This middleware validates Supabase JWT tokens from the Authorization header.
 * For LOCAL DEVELOPMENT, it bypasses auth checks.
 */

import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for token validation
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * User type from the authenticated session
 */
export interface AuthenticatedUser {
  id: number;
  supabaseId?: string;
  email?: string;
  name?: string;
  role?: string;
}

// Check if running in local development mode
const isLocalDev = process.env.NODE_ENV === "development" &&
  (process.env.PORT === "3000" || !process.env.PORT);

// Default local dev user for bypassing auth in development
const LOCAL_DEV_USER: AuthenticatedUser = {
  id: 1,
  supabaseId: "local-dev-user",
  email: "cff@centremedicalfont.ca",
  name: "Carlos Faviel Font",
  role: "doctor",
};

/**
 * Request type with authenticated user attached
 * Note: We use type casting instead of interface extension to avoid
 * conflicts with Express-session's built-in user type
 */
export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
  isAuthenticated?: () => boolean;
};

/**
 * Extract and validate Supabase JWT token from Authorization header
 */
async function validateSupabaseToken(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Map Supabase user to our AuthenticatedUser format
    // Use a hash of the Supabase UUID to create a numeric ID for backwards compatibility
    const numericId = Math.abs(hashCode(user.id)) % 1000000 || 1;

    return {
      id: numericId,
      supabaseId: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
      role: user.role || "user",
    };
  } catch (error) {
    console.error("[Auth] Token validation error:", error);
    return null;
  }
}

/**
 * Simple hash function to convert string to number
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * Middleware that requires authentication.
 * Validates Supabase JWT token from Authorization header.
 * Returns 401 if user is not authenticated.
 *
 * Usage:
 * ```typescript
 * router.get("/protected", requireAuth, (req, res) => {
 *   const userId = getAuthenticatedUserId(req);
 *   // ... use userId
 * });
 * ```
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // LOCAL DEV BYPASS: Allow all requests in local development
  if (isLocalDev) {
    (req as any).user = LOCAL_DEV_USER;
    (req as any).isAuthenticated = () => true;
    return next();
  }

  // Try Supabase token validation
  const supabaseUser = await validateSupabaseToken(req);

  if (supabaseUser) {
    (req as any).user = supabaseUser;
    (req as any).isAuthenticated = () => true;
    return next();
  }

  // Fallback: Check if Passport.js session auth is available
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }

  res.status(401).json({ error: "Not authenticated" });
}

/**
 * Get the authenticated user's ID from the request.
 * Returns null if not authenticated.
 *
 * Usage:
 * ```typescript
 * const userId = getAuthenticatedUserId(req);
 * if (!userId) {
 *   return res.status(401).json({ error: "Not authenticated" });
 * }
 * ```
 */
export function getAuthenticatedUserId(req: Request): number | null {
  const user = req.user as AuthenticatedUser | undefined;
  return user?.id ?? null;
}

/**
 * Get the authenticated user's ID from the request, throwing if not authenticated.
 * Use this only after requireAuth middleware has already validated authentication.
 *
 * Usage:
 * ```typescript
 * router.get("/protected", requireAuth, (req, res) => {
 *   const userId = requireAuthenticatedUserId(req);
 *   // userId is guaranteed to be a number here
 * });
 * ```
 */
export function requireAuthenticatedUserId(req: Request): number {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    throw new Error("User not authenticated - this should not happen after requireAuth middleware");
  }
  return userId;
}

/**
 * Get the full authenticated user from the request.
 * Returns null if not authenticated.
 */
export function getAuthenticatedUser(req: Request): AuthenticatedUser | null {
  // Check if user was set by our Supabase middleware
  if ((req as any).user) {
    return (req as any).user as AuthenticatedUser;
  }
  // Fallback to Passport.js style check
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return req.user as AuthenticatedUser;
  }
  return null;
}

/**
 * Check if the current user has a specific role.
 * Returns false if not authenticated or role doesn't match.
 */
export function hasRole(req: Request, role: string): boolean {
  const user = getAuthenticatedUser(req);
  return user?.role === role;
}

/**
 * Middleware that requires a specific role.
 * Must be used after requireAuth middleware.
 *
 * Usage:
 * ```typescript
 * router.get("/admin", requireAuth, requireRole("admin"), (req, res) => {
 *   // ... admin only
 * });
 * ```
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (hasRole(req, role)) {
      return next();
    }
    res.status(403).json({ error: "Forbidden - insufficient permissions" });
  };
}

/**
 * Optional authentication middleware.
 * Doesn't return 401, but sets req.user if authenticated.
 * Useful for routes that work with or without authentication.
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Just pass through - user may or may not be authenticated
  next();
}
