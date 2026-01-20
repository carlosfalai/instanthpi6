import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Get the current Supabase access token for API authentication
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.warn("[API] Failed to get auth session:", error);
  }

  return headers;
}

/**
 * Default fetcher for react-query
 */
export function getQueryFn(options?: { on401?: "returnNull" | "throw" }) {
  return async ({ queryKey }: { queryKey: string[] }) => {
    const [url] = queryKey;
    const headers = await getAuthHeaders();
    const res = await fetch(url, { headers });

    if (res.status === 401) {
      if (options?.on401 === "returnNull") {
        return null;
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    return res.json();
  };
}

/**
 * Helper for making API requests
 */
export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: any
) {
  const headers = await getAuthHeaders();

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    // Try to parse the error message
    try {
      const errorData = await res.json();
      throw new Error(errorData.message || `${res.status} ${res.statusText}`);
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error(`${res.status} ${res.statusText}`);
    }
  }

  return res;
}
