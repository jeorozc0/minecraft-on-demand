import { useQuery } from "@tanstack/react-query";
import type { RawServerResponse, ServerStatus } from "@/lib/types";
import { apiFetch, useAuthHeader } from "@/lib/api";
import { useSupabaseSession } from "@/providers/SupabasProvider";

class StatusError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export const useMcServerStatus = (serverId?: string, overrideStatus?: ServerStatus) => {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;
  const auth = useAuthHeader();

  return useQuery<RawServerResponse, StatusError>({
    queryKey: ["mcStatus", userId, serverId],
    queryFn: () => apiFetch<RawServerResponse>(`/servers/${serverId}`, { cache: "no-store", authSession: auth }),
    enabled: Boolean(userId) && Boolean(serverId),
    refetchInterval: (query) =>
      computeStatusRefetchInterval(
        overrideStatus ?? (query.state.data as RawServerResponse | undefined)?.serverStatus,
      ),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
    retry: 3,
  });
};

function computeStatusRefetchInterval(status?: ServerStatus): number | false {
  if (!status) return 5_000;
  if (status === "PENDING" || status === "STOPPING") return 5_000;
  return false; // RUNNING and STOPPED do not poll
}

