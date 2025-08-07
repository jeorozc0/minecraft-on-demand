import { useQuery } from "@tanstack/react-query";
import type { RawServerResponse } from "./useServerStatus";
import { apiFetch, useAuthHeader } from "@/lib/api";
import { useSupabaseSession } from "@/providers/SupabasProvider";

interface PagedServerResponse {
  items: RawServerResponse[];
  afterKey: string;
}

const fetchUserServer = async (
  limit: number,
  afterKey: string | undefined,
  auth: ReturnType<typeof useAuthHeader>,
): Promise<RawServerResponse | null> => {

  const url = new URL(`/servers`, window.location.origin);
  url.searchParams.append("limit", limit.toString());
  if (afterKey) {
    url.searchParams.append("afterKey", afterKey);
  }

  const data = await apiFetch<PagedServerResponse>(
    url.pathname + url.search,
    { cache: "no-store", authSession: auth },
  );
  return data.items.length > 0 ? data.items[0] : null;
};

export const useUserServer = (
  userId?: string,
  options?: { limit?: number; afterKey?: string },
) => {

  const { limit = 1, afterKey } = options ?? {};
  const { session } = useSupabaseSession();
  const authUserId = session?.user.id;
  const auth = useAuthHeader();

  return useQuery({
    queryKey: ["userServer", authUserId, limit, afterKey],
    queryFn: () => fetchUserServer(limit, afterKey, auth),
    enabled: !!authUserId,
    retry: false,
  });
};
