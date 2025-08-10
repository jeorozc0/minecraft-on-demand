"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { z } from "zod";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { ServerConfigurationSchema } from "@/lib/types/config";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUpdateConfiguration } from "@/lib/hooks/useUpdateServerConfiguration";
import { VersionSelect } from "@/components/ui/minecraft-version-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteConfig } from "@/lib/hooks/useDeleteConfig";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert-banner";
import { useQuery } from "@tanstack/react-query";
import fetchServerConfiguration from "@/lib/api/server-config";
import { useSupabaseSession } from "@/providers/SupabasProvider";
import { StatusError } from "@/lib/types/error";
import { fetchUserModpacks } from "@/lib/api/modpacks";
import { ModpackList } from "@/lib/zod/modpacks";
import React from "react";

type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;

const serverTypeOptions = [
  { label: "Vanilla", value: "VANILLA" },
  { label: "Paper", value: "PAPER" },
  { label: "Spigot", value: "SPIGOT" },
  { label: "Fabric", value: "FABRIC" },
  { label: "Forge", value: "FORGE" },
];

const gamemodeOptions = [
  { label: "Survival", value: "survival" },
  { label: "Creative", value: "creative" },
  { label: "Adventure", value: "adventure" },
];

const difficultyOptions = [
  { label: "Peaceful", value: "peaceful" },
  { label: "Easy", value: "easy" },
  { label: "Normal", value: "normal" },
  { label: "Hard", value: "hard" },
];

const levelTypeOptions = [
  { label: "Normal", value: "minecraft:normal" },
  { label: "Flat", value: "minecraft:flat" },
  { label: "Large Biomes", value: "minecraft:large_biomes" },
  { label: "Amplified", value: "minecraft:amplified" },
];

export default function ConfigurationPage() {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;
  const key = ["config", userId ?? "anon"] as const;
  const [selectedModpackId, setSelectedModpackId] = useState("");
  const { data: initialConfig, isLoading: isLoadingConfig, isError } = useQuery({
    queryKey: key as unknown as string[],
    queryFn: fetchServerConfiguration,
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      if (error instanceof StatusError && error.status === 404) return false;
      return failureCount < 3;
    },
  });

  const { data: modpacks } = useQuery<ModpackList>({
    queryKey: ["modpacks"],
    queryFn: fetchUserModpacks,
  });

  const safeModpacks: ModpackList = modpacks ?? { items: [], lastEvaluatedKey: "" };

  const { mutate: updateConfig, isPending: isSaving } = useUpdateConfiguration();
  const { mutate: deletConfig, isPending: isDeleting } = useDeleteConfig();
  const isProcessing = isSaving || isDeleting;

  const [formState, setFormState] = useState<Partial<ServerConfiguration>>({});
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    if (!isLoadingConfig) {
      const defaults: Partial<ServerConfiguration> = {
        version: "1.21",
        type: "PAPER",
        modrinth_download_dependencies: "required",
        motd: "A Minecraft server. Powered by §6AWS§r",
        ops: "",
        use_aikar_flags: "false",
        use_meowice_flags: "false",
      };
      const config = initialConfig ?? defaults;
      setFormState(config);

      if (config.modpackId) {
        setSelectedModpackId(config.modpackId);
      }
    }
  }, [initialConfig, isLoadingConfig]);

  const isDestructiveChange = useMemo(() => {
    if (!initialConfig || !formState.version || !formState.type) return false;
    return (
      initialConfig.version !== formState.version ||
      initialConfig.type !== formState.type
    );
  }, [initialConfig, formState.version, formState.type]);

  const handleValueChange = useCallback(
    <K extends keyof ServerConfiguration>(key: K, value: ServerConfiguration[K]) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const buildFinalConfig = (): ServerConfiguration => {
    const finalConfig = { ...formState } as ServerConfiguration;

    if (selectedModpackId) {
      const selectedPack = safeModpacks.items.find(
        (m) => m.modpackId === selectedModpackId
      );
      if (selectedPack) {
        finalConfig.modpackId = selectedPack.modpackId;
        finalConfig.modrinth_projects = selectedPack.mods
          .map((mod) => mod.slug)
          .filter(Boolean)
          .join(",");
      }
    }

    return finalConfig;
  };

  const proceedWithSave = () => {
    const finalConfig = buildFinalConfig();
    const validation = ServerConfigurationSchema.safeParse(finalConfig);
    if (validation.success) {
      deletConfig(undefined, {
        onSuccess: () => {
          updateConfig(validation.data);
        },
      });
    } else {
      toast.error("Invalid configuration", {
        description: "Please check the form for errors.",
      });
    }
  };

  const handleSave = () => {
    if (isDestructiveChange) {
      setIsAlertOpen(true);
    } else {
      const finalConfig = buildFinalConfig();
      const validation = ServerConfigurationSchema.safeParse(finalConfig);
      if (validation.success) {
        updateConfig(validation.data);
      } else {
        toast.error("Invalid configuration", {
          description: "Please check the form for errors.",
        });
      }
    }
  };

  const filteredModpacks = safeModpacks.items.filter(
    (m) =>
      m.version === formState.version &&
      m.type?.toUpperCase() === formState.type?.toUpperCase()
  );

  if (isLoadingConfig || Object.keys(formState).length === 0) {
    return (<div className="mx-auto max-w-4xl space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
        <div className="h-10 w-32 rounded bg-muted" />
      </div>

      {/* Cards */}
      {[1, 2, 3, 4, 5].map((card) => (
        <Card key={card}>
          <CardHeader>
            <div className="h-5 w-40 rounded bg-muted" />
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-10 w-full rounded bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>);
  }

  if (isError) {
    return <div>Error loading configuration.</div>;
  }

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Server Configuration</h1>
            <p className="text-sm text-muted-foreground">Choose your server basics, then tune gameplay, world, and performance.</p>
          </div>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save Changes
          </Button>
        </div>

        {isDestructiveChange && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>World Deletion Warning</AlertTitle>
            <AlertDescription>
              Changing the server type or Minecraft version will delete your current world.
            </AlertDescription>
          </Alert>
        )}

        {/* Core Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>Set the Minecraft version and server software. Changing either later may delete your current world.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <VersionSelect value={formState.version ?? ""} onChangeAction={(v) => handleValueChange("version", v)} />
            <MemoConfigSelect label="Server Type" value={formState.type} onValueChange={(v) => handleValueChange("type", v as ServerConfiguration["type"])} options={serverTypeOptions} />
          </CardContent>
        </Card>

        {/* Modpack */}
        <Card>
          <CardHeader>
            <CardTitle>Modpack</CardTitle>
            <CardDescription>Select a saved modpack that matches the chosen version and type. We’ll auto-fill projects from your modpack.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigSelect
              label="Modpack"
              value={selectedModpackId}
              onValueChange={(value) => {
                setSelectedModpackId(value);
                const selectedPack = safeModpacks.items.find((m) => m.modpackId === value);
                if (selectedPack) {
                  handleValueChange("modpackId", selectedPack.modpackId);
                  handleValueChange(
                    "modrinth_projects",
                    selectedPack.mods.map((mod) => mod.slug).filter(Boolean).join(",")
                  );
                }
              }}
              options={
                filteredModpacks.length > 0
                  ? filteredModpacks.map((m) => ({ label: m.modpackName, value: m.modpackId }))
                  : [{ label: "No compatible modpack found", value: "__no_modpack__", disabled: true }]
              }
            />
            <MemoConfigSelect
              label="Mod Dependencies"
              value={formState.modrinth_download_dependencies}
              onValueChange={(v) => handleValueChange("modrinth_download_dependencies", v as ServerConfiguration["modrinth_download_dependencies"])}
              options={[
                { label: "Required", value: "required" },
                { label: "None", value: "none" },
              ]}
              description="Automatically include required dependencies for selected mods."
            />
          </CardContent>
        </Card>

        {/* Game Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Gameplay Settings</CardTitle>
            <CardDescription>Tune how the game plays.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigSelect label="Gamemode" value={formState.mode} onValueChange={(v) => handleValueChange("mode", v as ServerConfiguration["mode"])} options={gamemodeOptions} />
            <MemoConfigSelect label="Difficulty" value={formState.difficulty} onValueChange={(v) => handleValueChange("difficulty", v as ServerConfiguration["difficulty"])} options={difficultyOptions} />
            <MemoConfigSwitch label="Hardcore Mode" checked={formState.hardcore === "true"} onCheckedChange={(v) => handleValueChange("hardcore", v ? "true" : "false")} />
            <MemoConfigSwitch label="Allow Flight" checked={formState.allow_flight === "TRUE"} onCheckedChange={(v) => handleValueChange("allow_flight", v ? "TRUE" : "FALSE")} />
          </CardContent>
        </Card>

        {/* World Settings */}
        <Card>
          <CardHeader>
            <CardTitle>World Settings</CardTitle>
            <CardDescription>Control world generation and dimensions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigInput label="World Seed" value={formState.seed ?? ""} onChange={(e) => handleValueChange("seed", e.target.value)} placeholder="Leave blank for random" description="Enter a specific seed or leave empty for a random world." />
            <MemoConfigSelect label="World Type" value={formState.level_type} onValueChange={(v) => handleValueChange("level_type", v as ServerConfiguration["level_type"])} options={levelTypeOptions} />
            <MemoConfigSwitch label="Generate Structures" checked={formState.generate_structures === "true"} onCheckedChange={(v) => handleValueChange("generate_structures", v ? "true" : "false")} />
            <MemoConfigSwitch label="Allow Nether" checked={formState.allow_nether === "true"} onCheckedChange={(v) => handleValueChange("allow_nether", v ? "true" : "false")} />
          </CardContent>
        </Card>

        {/* Players & Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Players & Performance</CardTitle>
            <CardDescription>Control player limits and performance-related options.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigInput label="Max Players" type="number" value={formState.max_players ?? "0"} onChange={(e) => handleValueChange("max_players", e.target.value)} description="Maximum simultaneous players allowed." />
            <MemoConfigInput label="View Distance (chunks)" type="number" value={formState.view_distance ?? "0"} onChange={(e) => handleValueChange("view_distance", e.target.value)} description="Higher values increase render distance but reduce performance." />
            <MemoConfigInput label="Simulation Distance (chunks)" type="number" value={formState.simulation_distance ?? "0"} onChange={(e) => handleValueChange("simulation_distance", e.target.value)} />
            <MemoConfigInput label="Spawn Protection (blocks)" type="number" value={formState.spawn_protection ?? "0"} onChange={(e) => handleValueChange("spawn_protection", e.target.value)} />
            <MemoConfigInput label="Compression Threshold (bytes)" type="number" value={formState.network_compression_threshold ?? "0"} onChange={(e) => handleValueChange("network_compression_threshold", e.target.value)} />
            <MemoConfigSwitch label="Online Mode" checked={formState.online_mode === "true"} onCheckedChange={(v) => handleValueChange("online_mode", v ? "true" : "false")} />
            <MemoConfigSwitch label="Spawn Animals" checked={formState.spawn_animals === "true"} onCheckedChange={(v) => handleValueChange("spawn_animals", v ? "true" : "false")} />
            <MemoConfigSwitch label="Spawn Monsters" checked={formState.spawn_monsters === "true"} onCheckedChange={(v) => handleValueChange("spawn_monsters", v ? "true" : "false")} />
            <MemoConfigSwitch label="Spawn NPCs" checked={formState.spawn_npcs === "true"} onCheckedChange={(v) => handleValueChange("spawn_npcs", v ? "true" : "false")} />
            <MemoConfigSwitch label="Sync Chunk Writes" checked={formState.sync_chunk_writes === "true"} onCheckedChange={(v) => handleValueChange("sync_chunk_writes", v ? "true" : "false")} />
          </CardContent>
        </Card>

        {/* Advanced & Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced & Metadata</CardTitle>
            <CardDescription>Optional server presentation and JVM tuning flags.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigInput label="Server MOTD" value={formState.motd ?? ""} onChange={(e) => handleValueChange("motd", e.target.value)} placeholder="A Minecraft server. Powered by AWS" description="Shown in the multiplayer server list." />
            <MemoConfigInput label="Server Operators" value={formState.ops ?? ""} onChange={(e) => handleValueChange("ops", e.target.value)} placeholder="comma,separated,usernames" description="Comma-separated Minecraft usernames with operator permissions." />
            <MemoConfigSwitch label="Enable Aikar JVM Flags" checked={formState.use_aikar_flags === "true"} onCheckedChange={(v) => handleValueChange("use_aikar_flags", v ? "true" : "false")} />
            <MemoConfigSwitch label="Enable Meowice JVM Flags" checked={formState.use_meowice_flags === "true"} onCheckedChange={(v) => handleValueChange("use_meowice_flags", v ? "true" : "false")} />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is destructive. Changing the server type or version will permanently delete your current world data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={proceedWithSave} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {isDeleting ? "Deleting World..." : "Continue & Delete World"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ------------------ Memoized Components ------------------ */
const MemoConfigInput = React.memo(function ConfigInput(
  props: React.ComponentProps<typeof Input> & { label: string; description?: string }
) {
  const { label, description, ...rest } = props;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input {...rest} />
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
});

type SelectOption = { label: string; value: string; disabled?: boolean };

const MemoConfigSelect = React.memo(function ConfigSelect({
  label,
  value,
  onValueChange,
  options,
  disabled,
  description,
}: {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
});

const MemoConfigSwitch = React.memo(function ConfigSwitch({
  label,
  checked,
  onCheckedChange,
  disabled,
  description,
  className,
}: {
  label: string;
  checked?: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 rounded-lg border p-3 ${className ?? "self-end"}`}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      </div>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
});
