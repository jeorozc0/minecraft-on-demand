import { z } from "zod";
import { getAccessToken } from "@/lib/utils";
import { apiFetch } from "./wrapper";
import { ModpackListResponseSchema, ModpackSchema } from "../zod/modpacks";
import { CreatePackInput } from "../hooks/usePostUserModpack";

type Modpack = z.infer<typeof ModpackSchema>;



export const CreatedModpackResponseSchema = z.object({
  modpackId: z.string(),
  createdAt: z.number(),
  location: z.string(),
});

export type CreatedModpackResponse = z.infer<
  typeof CreatedModpackResponseSchema
>;
/**
 * Fetches all modpacks for the authenticated user.
 */
type ModpackList = z.infer<typeof ModpackListResponseSchema>;

export async function fetchUserModpacks(): Promise<ModpackList> {
  const token = await getAccessToken();
  const data = await apiFetch<unknown>(`/modpacks`, {
    cache: "no-store",
    authSession: token ? { token } : null,
  });
  try {
    const parsed = ModpackListResponseSchema.parse(data);
    return parsed;
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

/*
 * Creates a modpack for the authenticated user.
 * Sends a POST request to /modpacks with the modpack data.
 */
export async function postUserModpack(
  modpack: CreatePackInput
): Promise<CreatedModpackResponse> {
  const token = await getAccessToken();

  const data = await apiFetch<unknown>(`/modpacks`, {
    method: "POST",
    cache: "no-store",
    authSession: token ? { token } : null,
    body: JSON.stringify(modpack),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return CreatedModpackResponseSchema.parse(data);
}

/*
 * Updates a modpack for the authenticated user.
 * Sends a PUT request to /modpacks with the modpack data.
 */
const PutResponseSchema = z.object({
  modpackId: z.string(),
  createdAt: z.number(),
  location: z.string(),
});

export async function putUserModpack(modpack: Modpack) {
  const token = await getAccessToken();

  const data = await apiFetch<unknown>(`/modpacks/`, {
    method: "PUT",
    cache: "no-store",
    authSession: token ? { token } : null,
    body: JSON.stringify(modpack),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return PutResponseSchema.parse(data);
}
