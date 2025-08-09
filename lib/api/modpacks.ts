import { z } from "zod";
import { getAccessToken } from "@/lib/utils";
import { apiFetch } from "./wrapper";
import { ModpackSchema } from "../zod/modpacks";

type Modpack = z.infer<typeof ModpackSchema>;

/**
 * Fetches all modpacks for the authenticated user.
 */
export default async function fetchUserModpacks(): Promise<Modpack[]> {
  const token = await getAccessToken();
  const data = await apiFetch<unknown>(`/modpacks`, {
    cache: "no-store",
    authSession: token ? { token } : null,
  });
  return z.array(ModpackSchema).parse(data);
}
