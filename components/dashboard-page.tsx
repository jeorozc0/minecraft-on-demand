"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Loader2, Info, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useServerManager } from "@/lib/hooks/useServerManager";
import { type ServerStatus } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { capitalizeFirstLetter } from "@/utils";
import { useSupabaseSession } from "@/providers/SupabasProvider";
import fetchServerConfiguration from "@/lib/api/server-config";
import { useQuery } from "@tanstack/react-query";
import { StatusError } from "@/lib/types/error";

const STATUS_META: Record<ServerStatus, { color: string; label: string }> = {
  PENDING: { color: "bg-yellow-500", label: "Pending…" },
  RUNNING: { color: "bg-green-500", label: "Running" },
  STOPPING: { color: "bg-red-500", label: "Stopping…" },
  STOPPED: { color: "bg-red-500", label: "Stopped" },
};

export default function Dashboard() {
  const {
    isLoading,
    isStarting,
    isStopping,
    status,
    config,
    publicIp,
    activeServerId,
    startServer,
    stopServer,
  } = useServerManager();

  const { session } = useSupabaseSession();
  const userId = session?.user.id;
  const { data: initialConfig,
  } = useQuery({
    queryKey: ['config'],
    queryFn: () => fetchServerConfiguration(),
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error instanceof StatusError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  })

  const handleStart = useCallback(() => {
    if (isStarting) return;
    startServer(undefined, {
      onSuccess: () => {
        toast.success("Server startup initiated", {
          description: "Give it a minute while we spin things up…",
        });
      },
      onError: (err: unknown) =>
        toast.error("Failed to start server", {
          description: err instanceof Error ? err.message : String(err),
        }),
    });
  }, [isStarting, startServer]);

  const handleStop = useCallback(() => {
    if (isStopping) return;
    if (!activeServerId) {
      toast.error("Cannot stop server", {
        description: "No active server ID found.",
      });
      return;
    }

    stopServer(
      { serverId: activeServerId as string },
      {
        onSuccess: () => {
          toast.success("Server shutdown initiated", {
            description: "The server is now stopping.",
          });
        },
        onError: (err) =>
          toast.error("Network error", {
            description: err instanceof Error ? err.message : String(err),
          }),
      },
    );
  }, [activeServerId, isStopping, stopServer]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="w-full text-center space-y-2">
          <div className="h-8 w-64 mx-auto rounded bg-muted" />
          <div className="h-4 w-80 mx-auto rounded bg-muted" />
        </div>

        {/* Control Panel skeleton */}
        <Card>
          <CardHeader>
            <div className="h-5 w-32 rounded bg-muted" />
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            {/* Status row */}
            <div className="flex w-full items-center justify-between">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-5 w-24 rounded bg-muted" />
            </div>
            {/* Action button */}
            <div className="h-10 w-32 rounded bg-muted" />
          </CardContent>
        </Card>

        {/* Server Information skeleton */}
        <Card>
          <CardHeader>
            <div className="h-5 w-40 rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4"
              >
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-4 w-40 rounded bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="w-full text-center">
        <h1 className="text-3xl font-bold">Server Management</h1>
        <p className="mt-2 text-muted-foreground">
          Start, stop, and monitor your Minecraft server instance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Control Panel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant="secondary" className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${STATUS_META[status as ServerStatus].color}`}
              />
              {STATUS_META[status as ServerStatus].label}
            </Badge>
          </div>

          {status === "RUNNING" || status === "STOPPING" || status === "PENDING" ? (
            <Button
              onClick={handleStop}
              variant="destructive"
              className="flex items-center gap-2"
              disabled={isStopping || status === "PENDING" || status === "STOPPING"}
            >
              {isStopping || status === "PENDING" || status === "STOPPING" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Square className="size-4" />
              )}
              Stop Server
            </Button>
          ) : initialConfig ? (
            <Button
              onClick={handleStart}
              disabled={isStarting || status !== "STOPPED"}
              className="flex items-center gap-2"
            >
              {isStarting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Start Server
            </Button>
          ) : (
            <div className="flex w-full items-center gap-3 rounded-lg bg-accent p-4 text-accent-foreground">
              <AlertCircle className="size-5 shrink-0" />
              <div className="flex-grow">
                <p className="text-sm font-medium">
                  No configuration found.
                </p>
                <p className="text-xs text-muted-foreground">
                  You must set up a server configuration before you can start a
                  server.
                </p>
              </div>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/config" prefetch>
                  Go to Config
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {status === "RUNNING" && (
        <Card>
          <CardHeader>
            <CardTitle>Server Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow
              label="Server IP"
              value={publicIp ?? "-"}
              tooltip="IP may take a minute or two to become reachable."
              isCopyable
            />
            <InfoRow
              label="Version"
              value={`${capitalizeFirstLetter(config.type)} ${config.version}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  tooltip,
  isCopyable,
}: {
  label: string;
  value: string;
  tooltip?: string;
  isCopyable?: boolean;
}) {
  const handleCopy = () => {
    if (!value || value === "-") return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast.success("Server IP copied!");
      })
      .catch((err) => {
        toast.error("Failed to copy IP", {
          description: err instanceof Error ? err.message : String(err),
        });
      });
  };

  return (
    <div className="grid grid-cols-[130px_1fr] items-center gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-2 text-muted-foreground">
        {value}
        {isCopyable && value && value !== "-" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={4}>
              <p>Copy IP</p>
            </TooltipContent>
          </Tooltip>
        )}
        {tooltip && !isCopyable && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 cursor-default text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={4}>
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </span>
    </div>
  );
}
