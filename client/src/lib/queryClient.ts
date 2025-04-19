import { QueryClient } from "@tanstack/react-query";

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
 * Default fetcher for react-query
 */
export function getQueryFn(options?: { on401?: "returnNull" | "throw" }) {
  return async ({ queryKey }: { queryKey: string[] }) => {
    const [url] = queryKey;
    const res = await fetch(url);

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
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

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