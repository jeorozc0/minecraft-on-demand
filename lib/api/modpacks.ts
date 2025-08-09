import { z } from "zod";
import { getAccessToken } from "@/lib/utils";
import { apiFetch } from "./wrapper";
import { ModpackSchema, ModpackSchemaGet } from "../zod/modpacks";

type Modpack = z.infer<typeof ModpackSchema>;
type Modpacks = z.infer<typeof ModpackSchemaGet>;


const ModpackListSchema = z.object({
  items: z.array(ModpackSchemaGet),
});

/**
 * Fetches all modpacks for the authenticated user.
 */
export async function fetchUserModpacks(): Promise<Modpacks[]> {
  const token = await getAccessToken();
  const data = await apiFetch<unknown>(`/modpacks`, {
    cache: "no-store",
    authSession: token ? { token } : null,
  });
  try {
    const parsed = ModpackListSchema.parse(data);
    return parsed.items;
  } catch (err) {
    console.error("Failed to parse modpack data:", err, "Raw data:", data);
    throw err;
  }
}

/**
 * Fetches a single modpack by ID for the authenticated user.
 * Validates the response against the ModpackSchema.
 */
export async function fetchUserModpackById(
  modpackId: string
): Promise<Modpack> {
  const token = await getAccessToken();

  const data = await apiFetch<unknown>(`/modpacks/${modpackId}`, {
    cache: "no-store",
    authSession: token ? { token } : null,
  });

  try {
    return ModpackSchema.parse(data);
  } catch (err) {
    console.error("Failed to parse modpack data:", err, "Raw data:", data);
    throw err;
  }
}

/**
 * Updates or creates a modpack for the authenticated user.
 * Sends a PUT request to /modpacks with the modpack data.
 */
export async function putUserModpack(
  modpack: Partial<Modpack>
): Promise<Modpack> {
  const token = await getAccessToken();

  const data = await apiFetch<unknown>(`/modpacks`, {
    method: "PUT",
    cache: "no-store",
    authSession: token ? { token } : null,
    body: JSON.stringify(modpack),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return ModpackSchema.parse(data);
}
