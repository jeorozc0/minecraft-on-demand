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
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
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


