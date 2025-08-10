import { z } from "zod";

export const ModSchema = z.object({
  projectId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  addedAt: z.number().int().positive(),
});

export const ModpackSchema = z.object({
  modpackId: z.string(),
  modpackName: z.string().min(1),
  mods: z.array(ModSchema),
  type: z.string(),
  version: z.string().min(1),
});

export const ModpackSchemaGet = z.object({
  modpackId: z.string().min(1),
  modpackName: z.string().min(1),
  createdAt: z.number().int().positive(),
  mods: z.array(ModSchema),
  type: z.string(),
  updatedAt: z.number().int().positive(),
  userId: z.string(),
  version: z.string().min(1),
});

export const ModpackListResponseSchema = z.object({
  items: z.array(ModpackSchemaGet),
  lastEvaluatedKey: z.string().optional(),
});


export type Modpack = z.infer<typeof ModpackSchema>;
export type ModpackList = z.infer<typeof ModpackListResponseSchema>;

