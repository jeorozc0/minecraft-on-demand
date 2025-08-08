import { useSupabaseSession } from "@/providers/SupabasProvider";
import { useStartServer } from "./useServer";
import { useMcServerStatus } from "./useServerStatus";
import { useUserServer } from "./useUserServer";
import { useStopServer } from "./useStopServer";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
  const [isOptimisticStopping, setIsOptimisticStopping] = useState(false);

  const activeServerId = newServerData?.serverId ?? existingServer?.serverId;

  // Pass an override status to ensure transient states keep polling
  const transientOverride: "STOPPING" | "PENDING" | undefined =
    (isOptimisticStopping || isStopping) ? "STOPPING" : (isStarting ? "PENDING" : undefined);
  const { data: statusData } = useMcServerStatus(activeServerId, transientOverride);

  const status =
    ((isOptimisticStopping || isStopping) && statusData?.serverStatus !== "STOPPED" ? "STOPPING" : undefined) ??
    (isStarting ? "PENDING" : undefined) ??
    statusData?.serverStatus ??
    (newServerData ? "PENDING" : undefined) ??
    existingServer?.serverStatus ??
    "STOPPED";

  const queryClient = useQueryClient();
  const prevVisibility = useRef<boolean>(true);
  // On focus/visibility regain, perform a one-off refetch regardless of current state
  useEffect(() => {
    const onVisibility = () => {
      const nowVisible = document.visibilityState === "visible";
      if (nowVisible && prevVisibility.current === false) {
        if (activeServerId && userId) {
          queryClient.invalidateQueries({ queryKey: ["mcStatus", userId, activeServerId] });
        }
      }
      prevVisibility.current = nowVisible;
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [activeServerId, userId, queryClient]);

  // Release optimistic STOPPING once the backend reports STOPPED
  useEffect(() => {
    if (isOptimisticStopping && statusData?.serverStatus === "STOPPED") {
      setIsOptimisticStopping(false);
    }
  }, [isOptimisticStopping, statusData?.serverStatus]);

  //

  // This is the simple config for the running server.
  const config =
    statusData?.serverConfig ??
    existingServer?.serverConfig ?? { version: "", type: "" };

  const publicIp = statusData?.publicIp;

  return {
    // Combine loading states for a simpler UI check.
    isLoading: isLoadingUserServer,
    isStarting,
    isStopping,
    status,
    config,
    publicIp,
    activeServerId,
    hasActiveServer: !!activeServerId && status === "RUNNING",
    // **NEW**: Expose whether a configuration exists.
    startServer,
    stopServer: ((variables, options) => {
      setIsOptimisticStopping(true);
      return stopServer(variables as Parameters<typeof stopServer>[0], {
        ...options,
        onError: (error: unknown, vars: Parameters<typeof stopServer>[0], ctx: unknown) => {
          setIsOptimisticStopping(false);
          // @ts-expect-error preserve caller's types
          options?.onError?.(error, vars, ctx);
        },
      } as Parameters<typeof stopServer>[1]);
    }) as typeof stopServer,
  };
};
