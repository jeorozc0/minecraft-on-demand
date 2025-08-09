import { z } from "zod";

export const ModSchema = z.object({
  projectId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  addedAt: z.number().int().positive(),
});

export const ModpackSchema = z.object({
  modpackId: z.string().min(1),
  modpackName: z.string().min(1),
  createdAt: z.number().int().positive(),
  mods: z.array(ModSchema),
  type: z.string(),
  updatedAt: z.number().int().positive(),
  version: z.string().min(1),
});

export const ModpackSchemaGet = z.object({
  modpackId: z.string().min(1),
  modpackName: z.string().min(1),
  createdAt: z.number().int().positive(),
  mods: z.number(),
  type: z.string(),
  updatedAt: z.number().int().positive(),
  version: z.string().min(1),
});


export type Modpack = z.infer<typeof ModpackSchema>;

