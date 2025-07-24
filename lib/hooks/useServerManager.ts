import { useSupabaseSession } from "@/providers/SupabasProvider";
import { useStartServer } from "./useServer";
import { useMcServerStatus } from "./useServerStatus";
import { useUserServer } from "./useUserServer";
import { useStopServer } from "./useStopServer";

export const useServerManager = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;
  const { data: existingServer, isLoading: isLoadingUserServer } = useUserServer(
    userId,
    { limit: 1 },
  );
  const {
    data: newServerData,
    mutate: startServer,
    isPending: isStarting,
  } = useStartServer();

  const {
    mutate: stopServer,
    isPending: isStopping,
  } = useStopServer();


  const activeServerId = newServerData?.serverId ?? existingServer?.serverId;

  const { data: statusData } = useMcServerStatus(activeServerId);

  const status =
    statusData?.serverStatus ??
    (newServerData ? "PENDING" : undefined) ??
    existingServer?.serverStatus ??
    "STOPPED";

  const config =
    statusData?.serverConfig ??
    existingServer?.serverConfig ?? { version: "", type: "" };

  const publicIp = statusData?.publicIp;

  return {
    isLoading: isLoadingUserServer,
    isStarting,
    isStopping,
    status,
    config,
    publicIp,
    hasActiveServer: !!activeServerId && status !== "STOPPED",
    startServer,
    stopServer
  };
};
