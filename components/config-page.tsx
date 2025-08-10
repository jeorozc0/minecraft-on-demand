"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { z } from "zod";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { ServerConfigurationSchema } from "@/lib/types/config";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <h1 className="text-3xl font-bold">Server Configuration</h1>
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
          <CardHeader><CardTitle>Core Settings</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <VersionSelect value={formState.version ?? ""} onChangeAction={(v) => handleValueChange("version", v)} />
            <MemoConfigSelect label="Server Type" value={formState.type} onValueChange={(v) => handleValueChange("type", v as ServerConfiguration["type"])} options={serverTypeOptions} />
          </CardContent>
        </Card>

        {/* Modpack */}
        <Card>
          <CardHeader><CardTitle>Modpack</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigSelect
              label="Select Modpack"
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
              label="Download Dependencies"
              value={formState.modrinth_download_dependencies}
              onValueChange={(v) => handleValueChange("modrinth_download_dependencies", v as ServerConfiguration["modrinth_download_dependencies"])}
              options={[
                { label: "Required", value: "required" },
                { label: "None", value: "none" },
              ]}
            />
          </CardContent>
        </Card>

        {/* Game Settings */}
        <Card>
          <CardHeader><CardTitle>Game Settings</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigSelect label="Gamemode" value={formState.mode} onValueChange={(v) => handleValueChange("mode", v as ServerConfiguration["mode"])} options={gamemodeOptions} />
            <MemoConfigSelect label="Difficulty" value={formState.difficulty} onValueChange={(v) => handleValueChange("difficulty", v as ServerConfiguration["difficulty"])} options={difficultyOptions} />
            <MemoConfigSwitch label="Hardcore" checked={formState.hardcore === "true"} onCheckedChange={(v) => handleValueChange("hardcore", v ? "true" : "false")} />
            <MemoConfigSwitch label="Allow Flight" checked={formState.allow_flight === "TRUE"} onCheckedChange={(v) => handleValueChange("allow_flight", v ? "TRUE" : "FALSE")} />
          </CardContent>
        </Card>

        {/* World Settings */}
        <Card>
          <CardHeader><CardTitle>World Settings</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigInput label="Seed" value={formState.seed ?? ""} onChange={(e) => handleValueChange("seed", e.target.value)} />
            <MemoConfigSelect label="Level Type" value={formState.level_type} onValueChange={(v) => handleValueChange("level_type", v as ServerConfiguration["level_type"])} options={levelTypeOptions} />
            <MemoConfigSwitch label="Generate Structures" checked={formState.generate_structures === "true"} onCheckedChange={(v) => handleValueChange("generate_structures", v ? "true" : "false")} />
            <MemoConfigSwitch label="Allow Nether" checked={formState.allow_nether === "true"} onCheckedChange={(v) => handleValueChange("allow_nether", v ? "true" : "false")} />
          </CardContent>
        </Card>

        {/* Player & Network Settings */}
        <Card>
          <CardHeader><CardTitle>Player & Network Settings</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigInput label="Max Players" type="number" value={formState.max_players ?? "0"} onChange={(e) => handleValueChange("max_players", e.target.value)} />
            <MemoConfigInput label="View Distance" type="number" value={formState.view_distance ?? "0"} onChange={(e) => handleValueChange("view_distance", e.target.value)} />
            <MemoConfigInput label="Simulation Distance" type="number" value={formState.simulation_distance ?? "0"} onChange={(e) => handleValueChange("simulation_distance", e.target.value)} />
            <MemoConfigInput label="Spawn Protection" type="number" value={formState.spawn_protection ?? "0"} onChange={(e) => handleValueChange("spawn_protection", e.target.value)} />
            <MemoConfigInput label="Network Compression Threshold" type="number" value={formState.network_compression_threshold ?? "0"} onChange={(e) => handleValueChange("network_compression_threshold", e.target.value)} />
            <MemoConfigSwitch label="Online Mode" checked={formState.online_mode === "true"} onCheckedChange={(v) => handleValueChange("online_mode", v ? "true" : "false")} />
            <MemoConfigSwitch label="Spawn Animals" checked={formState.spawn_animals === "true"} onCheckedChange={(v) => handleValueChange("spawn_animals", v ? "true" : "false")} />
            <MemoConfigSwitch label="Spawn Monsters" checked={formState.spawn_monsters === "true"} onCheckedChange={(v) => handleValueChange("spawn_monsters", v ? "true" : "false")} />
            <MemoConfigSwitch label="Spawn NPCs" checked={formState.spawn_npcs === "true"} onCheckedChange={(v) => handleValueChange("spawn_npcs", v ? "true" : "false")} />
            <MemoConfigSwitch label="Sync Chunk Writes" checked={formState.sync_chunk_writes === "true"} onCheckedChange={(v) => handleValueChange("sync_chunk_writes", v ? "true" : "false")} />
          </CardContent>
        </Card>

        {/* Extra Server Settings */}
        <Card>
          <CardHeader><CardTitle>Extra Server Settings</CardTitle></CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <MemoConfigInput label="MOTD" value={formState.motd ?? ""} onChange={(e) => handleValueChange("motd", e.target.value)} />
            <MemoConfigInput label="OPS" value={formState.ops ?? ""} onChange={(e) => handleValueChange("ops", e.target.value)} />
            <MemoConfigSwitch label="Use Aikar Flags" checked={formState.use_aikar_flags === "true"} onCheckedChange={(v) => handleValueChange("use_aikar_flags", v ? "true" : "false")} />
            <MemoConfigSwitch label="Use Meowice Flags" checked={formState.use_meowice_flags === "true"} onCheckedChange={(v) => handleValueChange("use_meowice_flags", v ? "true" : "false")} />
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
  props: React.ComponentProps<typeof Input> & { label: string }
) {
  const { label, ...rest } = props;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input {...rest} />
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
}: {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
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
    </div>
  );
});

const MemoConfigSwitch = React.memo(function ConfigSwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
});
