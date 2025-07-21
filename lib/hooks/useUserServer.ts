import { useQuery } from "@tanstack/react-query";
import type { RawServerResponse } from "./useServerStatus";
import { getAccessToken } from "@/lib/utils";
import { API_URL } from "../constants";


const fetchUserServer = async (
  userId: string,
  limit: number,
): Promise<RawServerResponse | null> => {

  const url = new URL(
    API_URL,
  );
  url.searchParams.append("userId", userId);
  url.searchParams.append("limit", limit.toString());

  const res = await fetch(url, { cache: "no-store", headers: { Authorization: await getAccessToken() } });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch user server: ${res.statusText}`);
  }

  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  if (!Array.isArray(data) && data.serverId) {
    return data;
  }
  return null;
};

export const useUserServer = (
  userId?: string,
  options?: { limit?: number },
) => {

  const { limit = 1 } = options ?? {};

  return useQuery({
    queryKey: ["userServer", userId, limit],
    queryFn: () => fetchUserServer(userId!, limit),
    enabled: !!userId,
    retry: false,
  });
};
