import { API_URL } from "@/lib/constants";
import { getAccessToken } from "@/lib/utils";
import { useSupabaseSession } from "@/providers/SupabasProvider";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiOptions extends RequestInit {
  signal?: AbortSignal;
  authSession?: { token?: string } | null;
}

// Unified fetcher with abort support and auth header injection
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const controller = new AbortController();
  const { signal, headers, authSession, ...rest } = options;
  const composedSignal = mergeAbortSignals(signal, controller.signal);

  const authHeader = authSession?.token
    ? `Bearer ${authSession.token}`
    : await getAccessToken();

  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(headers || {}),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    signal: composedSignal,
  });

  if (!res.ok) {
    // Always include status code in the thrown error message so callers can pattern-match reliably
    let errorMessage = "";
    try {
      const errorResponseBody: unknown = await res.json();
      if (errorResponseBody && typeof errorResponseBody === "object") {
        const messageField: unknown = (errorResponseBody as { message?: unknown }).message;
        if (typeof messageField === "string") {
          errorMessage = messageField;
        }
      }
    } catch {
      // ignore JSON parse errors; we'll fall back to a generic message
    }
    const formattedErrorMessage = errorMessage
      ? `${errorMessage} (${res.status})`
      : `Request failed (${res.status})`;
    const error = new Error(formattedErrorMessage) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  // Attempt JSON; fall back to text
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

function mergeAbortSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  if (!a) return b;
  if (!b) return a;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener("abort", onAbort);
  b.addEventListener("abort", onAbort);
  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}

// Hook helper to supply user token to apiFetch without refetching session repeatedly
export function useAuthHeader() {
  const { session } = useSupabaseSession();
  const token = session?.access_token;
  return token ? { token } : null;
}


