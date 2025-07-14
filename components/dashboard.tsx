
"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { VersionSelect } from "@/components/ui/minecraft-version-select";
import { useStartServer } from "@/lib/hooks/useServer";
import { useMcServerStatus } from "@/lib/hooks/useServerStatus";

export type ServerStatus = "PENDING" | "RUNNING" | "STOPPED";

const STATUS_COLOR: Record<ServerStatus, string> = {
  PENDING: "bg-yellow-500",
  RUNNING: "bg-green-500",
  STOPPED: "bg-red-500",
};

const STATUS_LABEL: Record<ServerStatus, string> = {
  PENDING: "Pending…",
  RUNNING: "Running",
  STOPPED: "Stopped",
};

export default function Dashboard() {
  const [version, setVersion] = useState("");
  const [type, setServerType] = useState("");

  const [pollStatus, setPollStatus] = useState(false); // ← starts off

  const { data: serverStatusRaw } = useMcServerStatus(undefined, pollStatus);
  const serverStatus: ServerStatus = serverStatusRaw?.serverStatus ?? "STOPPED";

  const { mutate: startServer, isPending: isStarting } = useStartServer();

  const handleStartServer = useCallback(() => {
    if (!version || !type) {
      toast.error("Missing configuration", {
        description: "Select both a version and a server type first.",
      });
      return;
    }

    startServer(
      { type, version },
      {
        onSuccess: () => {
          toast.success("Request accepted", {
            description: "Server startup initiated. This may take a few minutes…",
          });
          setPollStatus(true); // 🚀 start polling only after success
        },
        onError: (err) =>
          toast.error("Network error", {
            description: err instanceof Error ? err.message : String(err),
          }),
      },
    );
  }, [version, type, startServer]);

  // TODO: wire to /servers/{id}/stop when the endpoint is ready
  const handleStopServer = useCallback(() => {
    toast("Stopping not implemented yet");
  }, []);

  const disableStart =
    isStarting || !version || !type || serverStatus !== "STOPPED";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Minecraft Server Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Configure and manage your Minecraft server.
          </p>
        </div>

        {/* STATUS CARD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Server Status
              <Badge variant="secondary" className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${STATUS_COLOR[serverStatus]}`}
                />
                {STATUS_LABEL[serverStatus]}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* CONFIG CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Server Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Version */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Minecraft Version</label>
                <VersionSelect value={version} onChange={setVersion} />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Server Type</label>
                <Select value={type} onValueChange={setServerType}>
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

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {serverStatus === "STOPPED" ? (
                <Button
                  onClick={handleStartServer}
                  disabled={disableStart}
                  className="flex items-center gap-2"
                >
                  {isStarting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Start Server
                </Button>
              ) : (
                <Button
                  onClick={handleStopServer}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop Server
                </Button>
              )}
            </div>

            {version && type && (
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Selected Configuration:</strong> {type} server running
                  Minecraft {version}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* INFORMATION CARD */}
        {serverStatus === "RUNNING" && (
          <Card>
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <InfoRow label="Server IP" value={serverStatusRaw?.publicIp ?? "-"} />
                <InfoRow label="Port" value="25565" />
                <InfoRow label="Players Online" value="0/20" />
                <InfoRow label="Uptime" value="Just started" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-medium">{label}:</span>
      <p className="text-gray-600">{value}</p>
    </div>
  );
}

