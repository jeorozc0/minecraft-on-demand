import { useQuery } from "@tanstack/react-query";
import type { RawServerResponse } from "./useServerStatus";
import { getAccessToken } from "@/lib/utils";
import { API_URL } from "../constants";

interface PagedServerResponse {
  items: RawServerResponse[];
  afterKey: string;
}

const fetchUserServer = async (
  limit: number,
  afterKey?: string,
): Promise<RawServerResponse | null> => {

  const url = new URL(
    API_URL,
  );
  url.searchParams.append("limit", limit.toString());
  if (afterKey) {
    url.searchParams.append("afterKey", afterKey);
  }

  const res = await fetch(url, {
    cache: "no-store", headers: { Authorization: await getAccessToken() }
  });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch user server: ${res.statusText}`);
  }

  const data = await res.json() as PagedServerResponse;
  return data.items.length > 0 ? data.items[0] : null;
};

export const useUserServer = (
  userId?: string,
  options?: { limit?: number; afterKey?: string },
) => {

  const { limit = 1, afterKey } = options ?? {};

  return useQuery({
    queryKey: ["userServer", limit, afterKey],
    queryFn: () => fetchUserServer(limit, afterKey),
    enabled: !!userId,
    retry: false,
  });
};
