import { API_URL } from "@/lib/constants";
import { getAccessToken } from "@/lib/utils";
import { useSupabaseSession } from "@/providers/SupabasProvider";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiOptions extends RequestInit {
  signal?: AbortSignal;
  authSession?: { token?: string } | null;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const { signal, headers, authSession, ...rest } = options;
  const composedSignal = mergeAbortSignals(signal, controller.signal);

  const authHeader =
    authSession?.token || (await getAccessToken()) || undefined;

  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(headers || {}),
      ...(authHeader ? { Authorization: `${authHeader}` } : {}),
    },
    signal: composedSignal,
  });

  if (!res.ok) {
    let errorMessage = "";
    try {
      const errorResponseBody: unknown = await res.json();
      if (errorResponseBody && typeof errorResponseBody === "object") {
        const messageField: unknown = (errorResponseBody as { message?: unknown })
          .message;
        if (typeof messageField === "string") {
          errorMessage = messageField;
        }
      }
    } catch { }
    const formattedErrorMessage = errorMessage
      ? `${errorMessage} (${res.status})`
      : `Request failed (${res.status})`;
    const error = new Error(formattedErrorMessage) as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

function mergeAbortSignals(
  a?: AbortSignal,
  b?: AbortSignal
): AbortSignal | undefined {
  if (!a) return b;
  if (!b) return a;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener("abort", onAbort);
  b.addEventListener("abort", onAbort);
  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}

// Hook to get token from Supabase session
export function useAuthHeader() {
  const { session } = useSupabaseSession();
  const token = session?.access_token;
  return token ? { token } : null;
}

// React-bound fetcher that always includes auth
export function useAuthedApiFetch() {
  const auth = useAuthHeader();
  return <T>(path: string, options: ApiOptions = {}) =>
    apiFetch<T>(path, { ...options, authSession: auth });
}
