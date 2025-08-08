import { z } from "zod";
import { ServerConfigurationSchema } from "../types/config";
import { getAccessToken } from "@/lib/utils";
import { apiFetch } from "./wrapper";

type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;

/**
 * Fetches the server configuration from the API.
 * Always includes the auth token automatically.
 */
export default async function fetchServerConfiguration(): Promise<
  ServerConfiguration | null
> {
  try {
    const token = await getAccessToken(); // works on server & client
    const data = await apiFetch<unknown>(`/server-configuration`, {
      cache: "no-store",
      authSession: token ? { token } : null,
    });
    return ServerConfigurationSchema.parse(data);
  } catch (e) {
    if (e instanceof Error && /\(404\)/.test(e.message)) {
      return null;
    }
    throw e;
  }
}
