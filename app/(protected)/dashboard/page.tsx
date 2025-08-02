"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Loader2, Info, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useServerManager } from "@/lib/hooks/useServerManager";
import { type ServerStatus } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { capitalizeFirstLetter } from "@/utils";

const STATUS_META: Record<ServerStatus, { color: string; label: string }> = {
  PENDING: { color: "bg-yellow-500", label: "Pending…" },
  RUNNING: { color: "bg-green-500", label: "Running" },
  STOPPED: { color: "bg-red-500", label: "Stopped" },
};

export default function Dashboard() {
  const router = useRouter();
  const {
    isLoading,
    isStarting,
    isStopping,
    status,
    config,
    publicIp,
    activeServerId,
    hasActiveServer,
    hasConfiguration,
    startServer,
    stopServer,
  } = useServerManager();


  const handleStart = useCallback(() => {
    // The start function no longer needs parameters.
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
  }, [startServer]);

  const handleStop = useCallback(() => {
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
  }, [activeServerId, stopServer]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Checking for your server...</p>
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
                className={`size-2 rounded-full ${STATUS_META[status].color}`}
              />
              {STATUS_META[status].label}
            </Badge>
          </div>

          {hasActiveServer ? (
            <Button
              onClick={handleStop}
              variant="destructive"
              className="flex items-center gap-2"
              disabled={isStopping || status === "PENDING"}
            >
              {isStopping || status === "PENDING" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Square className="size-4" />
              )}
              Stop Server
            </Button>
          ) : hasConfiguration ? (
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
              <Button
                size="sm"
                variant="secondary"
                onClick={() => router.push("/config")}
              >
                Go to Config
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
