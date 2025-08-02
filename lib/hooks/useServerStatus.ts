import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/utils";
import { API_URL } from "../constants";

export type ServerStatus = "PENDING" | "RUNNING" | "STOPPED";

export interface RawServerResponse {
  serverId: string;
  startedAt: number | null;
  endedAt: number | null;
  serverStatus: ServerStatus;
  serverConfig: {
    type: string;
    version: string;
  };
  publicIp?: string;
}

class StatusError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

/* ─── API fetcher ─── */
const fetchServerStatus = async (
  serverId: string,
): Promise<RawServerResponse> => {

  const res = await fetch(
    `${API_URL}/servers/${serverId}`,
    { cache: "no-store", headers: { Authorization: await getAccessToken() } },
  );
  if (!res.ok) {
    throw new StatusError(`Failed to fetch status (${res.status})`);
  }
  return res.json();
};

export const useMcServerStatus = (serverId?: string) =>
  useQuery<RawServerResponse, StatusError>({
    queryKey: ["mcStatus", serverId],
    queryFn: () => fetchServerStatus(serverId!),
    enabled: Boolean(serverId),             // only run when id is provided
    refetchInterval: 15_000,                // every 15 s
    refetchIntervalInBackground: true,      // keep polling when tab is hidden
    staleTime: 15_000,                      // match interval
    retry: 3,
  });

