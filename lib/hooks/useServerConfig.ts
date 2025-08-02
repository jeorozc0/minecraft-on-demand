import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getAccessToken } from "@/lib/utils";
import { API_URL } from "../constants";
import { ServerConfigurationSchema } from "../types/config";

type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;

class StatusError extends Error {
  public readonly status: number;

  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

// The function now returns Promise<ServerConfiguration | null>
const fetchServerConfiguration = async (): Promise<ServerConfiguration | null> => {
  const res = await fetch(`${API_URL}/server-configuration`, {
    cache: "no-store",
    headers: { Authorization: await getAccessToken() },
  });

  // **NEW**: Handle 404 Not Found as a valid case (no config exists)
  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new StatusError(
      `Failed to fetch configuration (${res.status})`,
      res.status,
    );
  }

  const data = await res.json();

  return ServerConfigurationSchema.parse(data);
};

export const useMcServerConfiguration = () =>
  // The query can now resolve to ServerConfiguration or null
  useQuery<ServerConfiguration | null, Error>({
    queryKey: ["config"],
    queryFn: fetchServerConfiguration,
    // It's good practice to disable retries for 404s
    retry: (failureCount, error) => {
      if (error instanceof StatusError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
