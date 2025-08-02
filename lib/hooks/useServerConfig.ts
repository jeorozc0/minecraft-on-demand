import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getAccessToken } from "@/lib/utils";
import { API_URL } from "../constants";
import ServerConfigurationPayloadSchema from "../types/config";

type ServerConfiguration = z.infer<typeof ServerConfigurationPayloadSchema>;

class StatusError extends Error {
  public readonly status: number;

  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

const fetchServerConfiguration = async (): Promise<ServerConfiguration> => {
  const res = await fetch(`${API_URL}/server-configuration`, {
    cache: "no-store",
    headers: { Authorization: await getAccessToken() },
  });

  if (!res.ok) {
    throw new StatusError(`Failed to fetch configuration (${res.status})`, res.status);
  }

  const data = await res.json();

  return ServerConfigurationPayloadSchema.parse(data);
};

export const useMcServerConfiguration = () =>
  useQuery<ServerConfiguration, Error>({
    queryKey: ["config"],
    queryFn: fetchServerConfiguration,
  });
