import { useStartServer } from "./useServer";
import { useMcServerStatus } from "./useServerStatus";
import { useUserServer } from "./useUserServer";

export const useServerManager = () => {
  const { data: existingServer, isLoading: isLoadingUserServer } = useUserServer();
  const {
    data: newServerData,
    mutate: startServer,
    isPending: isStarting,
  } = useStartServer();

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
    status,
    config,
    publicIp,
    hasActiveServer: !!activeServerId && status !== "STOPPED",
    startServer,
  };
};
