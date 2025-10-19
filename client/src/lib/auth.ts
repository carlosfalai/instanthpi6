import { supabase } from './supabase';

const POST_AUTH_REDIRECT_KEY = 'instanthpi_post_auth_redirect';

export function rememberPostAuthRedirect(path: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

export function consumePostAuthRedirect(): string | null {
  if (typeof window === 'undefined') return null;
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

export async function startGoogleLogin(nextPath: string) {
  if (typeof window === 'undefined') {
    return { error: 'Google sign-in is only available in the browser.' };
  }

  rememberPostAuthRedirect(nextPath);

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'openid email profile',
      },
    });

    if (error) {
      return { error: error.message || 'Google sign-in failed. Please try again.' };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error?.message || 'Google sign-in failed. Please try again.' };
  }
}
