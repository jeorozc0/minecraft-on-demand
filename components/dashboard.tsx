"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { VersionSelect } from "@/components/ui/minecraft-version-select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useServerManager } from "@/lib/hooks/useServerManager";
import { capitalizeFirstLetter } from "@/utils";

export type ServerStatus = "PENDING" | "RUNNING" | "STOPPED";

const STATUS_META: Record<ServerStatus, { color: string; label: string }> = {
  PENDING: { color: "bg-yellow-500", label: "Pending…" },
  RUNNING: { color: "bg-green-500", label: "Running" },
  STOPPED: { color: "bg-red-500", label: "Stopped" },
};

export default function Dashboard() {
  const {
    isLoading,
    isStarting,
    status,
    config,
    publicIp,
    hasActiveServer,
    startServer,
  } = useServerManager();

  const [formConfig, setFormConfig] = useState<{ version: string; type: string }>({
    version: "",
    type: "",
  });

  const handleStart = useCallback(() => {
    const { version, type } = formConfig;
    if (!version || !type) {
      toast.error("Missing configuration", {
        description: "Select both a version and a server type first.",
      });
      return;
    }

    startServer(
      { version, type },
      {
        onSuccess: () => {
          toast.success("Server startup initiated", {
            description: "Give it a minute while we spin things up…",
          });
        },
        onError: (err: unknown) =>
          toast.error("Network error", {
            description: err instanceof Error ? err.message : String(err),
          }),
      },
    );
  }, [formConfig, startServer]);

  const handleStop = useCallback(() => {
    toast("Stopping not implemented yet");
  }, []);

  const canStart = useMemo(
    () =>
      !isStarting &&
      Boolean(formConfig.version) &&
      Boolean(formConfig.type) &&
      status === "STOPPED",
    [isStarting, formConfig, status],
  );

  if (isLoading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Checking for your server...</p>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-background p-6">
      <section className="mx-auto max-w-2xl space-y-6">
        {/* HEADER */}
        <header className="text-center">
          <h1 className="text-3xl font-bold">Minecraft Server Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Configure and manage your Minecraft server.
          </p>
        </header>

        {/* STATUS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Server Status
              <Badge variant="secondary" className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${STATUS_META[status].color}`}
                />
                {STATUS_META[status].label}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* CONFIGURATION */}
        <Card>
          <CardHeader>
            <CardTitle>Server Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Version */}
              <div>
                <label className="block text-sm font-medium">
                  Minecraft Version
                </label>
                <VersionSelect
                  value={formConfig.version}
                  onChangeAction={(v) =>
                    setFormConfig((prev) => ({ ...prev, version: v }))
                  }
                  disabled={hasActiveServer}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium">Server Type</label>
                <Select
                  value={formConfig.type}
                  onValueChange={(v) =>
                    setFormConfig((prev) => ({ ...prev, type: v }))
                  }
                  disabled={hasActiveServer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select server type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["VANILLA", "PAPER", "SPIGOT", "FABRIC", "FORGE"].map(
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-4">
              {!hasActiveServer ? (
                <Button
                  onClick={handleStart}
                  disabled={!canStart}
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
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="size-4" />
                  Stop Server
                </Button>
              )}
            </div>

            {formConfig.version && formConfig.type && !hasActiveServer && (
              <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
                <strong>Selected:</strong> {capitalizeFirstLetter(formConfig.type)} &middot;{" "}
                {formConfig.version}
              </p>
            )}
          </CardContent>
        </Card>

        {/* LIVE INFO */}
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
              />
              <InfoRow
                label="Version"
                value={`${config.type} ${config.version}`}
              />
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

function InfoRow({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr] items-center text-sm gap-1">
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-1 text-gray-600">
        {value}
        {tooltip && (
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
