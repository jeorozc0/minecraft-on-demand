export type ServerStatus = "PENDING" | "RUNNING" | "STOPPED" | "STOPPING";

export interface RawServerResponse {
  serverId: string;
  startedAt: number | null;    // null if not started yet
  endedAt: number | null;    // null while running
  serverStatus: ServerStatus;
  serverConfig: {
    type: string;
    version: string;
  };
  publicIp?: string;
}
