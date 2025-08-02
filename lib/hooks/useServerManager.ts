import { useSupabaseSession } from "@/providers/SupabasProvider";
import { useStartServer } from "./useServer";
import { useMcServerStatus } from "./useServerStatus";
import { useUserServer } from "./useUserServer";
import { useStopServer } from "./useStopServer";
import { useMcServerConfiguration } from "./useServerConfig";

export const useServerManager = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;
  const { data: existingServer, isLoading: isLoadingUserServer } =
    useUserServer(userId, { limit: 1 });

  const {
    data: newServerData,
    mutate: startServer,
    isPending: isStarting,
  } = useStartServer();

  const { mutate: stopServer, isPending: isStopping } = useStopServer();

  const activeServerId = newServerData?.serverId ?? existingServer?.serverId;

  // Fetch the full server configuration.
  const { data: serverConfig, isLoading: isLoadingConfig } =
    useMcServerConfiguration();

  const { data: statusData } = useMcServerStatus(activeServerId);

  const status =
    statusData?.serverStatus ??
    (newServerData ? "PENDING" : undefined) ??
    existingServer?.serverStatus ??
    "STOPPED";

  console.log(status);

  // This is the simple config for the running server.
  const config =
    statusData?.serverConfig ??
    existingServer?.serverConfig ?? { version: "", type: "" };

  const publicIp = statusData?.publicIp;

  return {
    // Combine loading states for a simpler UI check.
    isLoading: isLoadingUserServer || isLoadingConfig,
    isStarting,
    isStopping,
    status,
    config,
    publicIp,
    activeServerId,
    hasActiveServer: !!activeServerId && status === "RUNNING",
    // **NEW**: Expose whether a configuration exists.
    hasConfiguration: !!serverConfig,
    startServer,
    stopServer,
  };
};
