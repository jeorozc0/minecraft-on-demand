import { useQuery } from "@tanstack/react-query";

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
  retryAfter: number;
  constructor(message: string, retryAfter: number) {
    super(message);
    this.retryAfter = retryAfter;
  }
}

const DEFAULT_POLL_SEC = 15;

const fetchServerStatus = async (
  serverId: string,
): Promise<RawServerResponse> => {
  const res = await fetch(
    `https://lisifqtzud.execute-api.us-east-1.amazonaws.com/prod/servers/${serverId}`,
    { cache: "no-store" },
  );

  const retryAfterHdr = res.headers.get("Retry-After");
  const retryAfter =
    retryAfterHdr ? parseInt(retryAfterHdr, 10) : DEFAULT_POLL_SEC;

  if (!res.ok) {
    throw new StatusError(
      `Failed to fetch server status: ${res.status}`,
      retryAfter,
    );
  }

  return res.json() as Promise<RawServerResponse>;
};

export const useMcServerStatus = (
  serverId = "opwd9hi6i3vi",
  enabled = true,
) =>
  useQuery<RawServerResponse, StatusError>({
    queryKey: ["mcStatus", serverId],
    queryFn: () => fetchServerStatus(serverId),
    enabled,

    refetchInterval: (query) => {
      const intervalErr = query.state.error?.retryAfter;
      const intervalData = query.state.data ? DEFAULT_POLL_SEC : undefined;
      const chosen = intervalErr ?? intervalData ?? DEFAULT_POLL_SEC;
      return chosen * 1000;
    },

    retry: 3,
    staleTime: 10_000,
    refetchIntervalInBackground: false,
  });

