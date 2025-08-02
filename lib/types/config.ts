import z from "zod";

export const ServerConfigurationPayloadSchema = z.object({
  version: z.string(),
  type: z.enum(["VANILLA", "FABRIC", "FORGE", "SPIGOT", "PAPER"]),
  spawn_protection: z.string(),
  seed: z.string().max(32),
  hardcore: z.enum(["true", "false"]),
  allow_flight: z.enum(["TRUE", "FALSE"]),
  allow_nether: z.enum(["true", "false"]),
  spawn_monsters: z.enum(["true", "false"]),
  online_mode: z.enum(["true", "false"]),
  generate_structures: z.enum(["true", "false"]),
  level_type: z.enum(["minecraft:normal", "minecraft:flat", "minecraft:large_biomes", "minecraft:amplified"]),
  network_compression_threshold: z.string(),
  simulation_distance: z.string(),
  difficulty: z.enum(["peaceful", "easy", "normal", "hard"]),
  mode: z.enum(["creative", "survival", "adventure"]),
  spawn_animals: z.enum(["true", "false"]),
  view_distance: z.string(),
  max_players: z.string(),
  sync_chunk_writes: z.enum(["true", "false"]),
  spawn_npcs: z.enum(["true", "false"]),
})

export default ServerConfigurationPayloadSchema
