"use client";

import { useEffect, useMemo, useState } from "react";
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

type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;

// Mapped options for user-friendly select dropdowns
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

  const { data: initialConfig, isLoading: isLoadingConfig, isError } = useQuery({
    queryKey: key as unknown as string[],
    queryFn: fetchServerConfiguration,
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true, // allow remount refetch when invalidated
    retry: (failureCount, error) => {
      if (error instanceof StatusError && error.status === 404) return false;
      return failureCount < 3;
    },
  });

  const { mutate: updateConfig, isPending: isSaving } = useUpdateConfiguration();
  const { mutate: deletConfig, isPending: isDeleting } = useDeleteConfig();
  const isProcessing = isSaving || isDeleting;

  const [formState, setFormState] = useState<Partial<ServerConfiguration>>({});
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    if (!isLoadingConfig) {
      setFormState(
        initialConfig ??
        ({
          version: "1.21",
          type: "PAPER",
        } as Partial<ServerConfiguration>)
      );
    }
  }, [initialConfig, isLoadingConfig]);

  const isDestructiveChange = useMemo(() => {
    if (!initialConfig || !formState.version || !formState.type) return false;
    return (
      initialConfig.version !== formState.version ||
      initialConfig.type !== formState.type
    );
  }, [initialConfig, formState.version, formState.type]);

  const handleValueChange = (
    key: keyof ServerConfiguration,
    value: string,
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const proceedWithSave = () => {
    const validation = ServerConfigurationSchema.safeParse(formState);
    if (validation.success) {
      // DELETE world data first, then run the optimistic update mutation
      deletConfig(undefined, {
        onSuccess: () => {
          updateConfig(validation.data);
        },
      });
    } else {
      toast.error("Invalid configuration", {
        description: "Please check the form for errors.",
      });
      console.error("Validation Errors:", validation.error.format());
    }
  };

  const handleSave = () => {
    if (isDestructiveChange) {
      setIsAlertOpen(true);
    } else {
      const validation = ServerConfigurationSchema.safeParse(formState);
      if (validation.success) {
        updateConfig(validation.data); // optimistic mutation handles UI
      } else {
        toast.error("Invalid configuration", {
          description: "Please check the form for errors.",
        });
      }
    }
  };

  if (isLoadingConfig || Object.keys(formState).length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Loading configuration...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">
          An error occurred while fetching the configuration.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Server Configuration</h1>
            <p className="text-muted-foreground">
              {initialConfig
                ? "Modify and save live server properties."
                : "Create your initial server configuration."}
            </p>
          </div>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Changes
          </Button>
        </div>

        {isDestructiveChange && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>World Deletion Warning</AlertTitle>
            <AlertDescription>
              Changing the server type or Minecraft version will delete your
              current world and all its data upon saving. This action cannot be
              undone.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Core Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <Label>Minecraft Version</Label>
              <VersionSelect
                value={formState.version ?? ""}
                onChangeAction={(v) => handleValueChange("version", v)}
              />
            </div>
            <ConfigSelect
              label="Server Type"
              value={formState.type}
              onValueChange={(v) => handleValueChange("type", v)}
              options={serverTypeOptions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <ConfigSelect
              label="Gamemode"
              value={formState.mode}
              onValueChange={(v) => handleValueChange("mode", v)}
              options={gamemodeOptions}
            />
            <ConfigSelect
              label="Difficulty"
              value={formState.difficulty}
              onValueChange={(v) => handleValueChange("difficulty", v)}
              options={difficultyOptions}
            />
            <ConfigSwitch
              label="Hardcore"
              checked={formState.hardcore === "true"}
              onCheckedChange={(v) =>
                handleValueChange("hardcore", v ? "true" : "false")
              }
            />
            <ConfigSwitch
              label="Allow Flight"
              checked={formState.allow_flight === "TRUE"}
              onCheckedChange={(v) =>
                handleValueChange("allow_flight", v ? "TRUE" : "FALSE")
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>World Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <ConfigInput
              label="Seed"
              value={formState.seed ?? ""}
              onChange={(e) => handleValueChange("seed", e.target.value)}
            />
            <ConfigSelect
              label="Level Type"
              value={formState.level_type}
              onValueChange={(v) => handleValueChange("level_type", v)}
              options={levelTypeOptions}
            />
            <ConfigSwitch
              label="Generate Structures"
              checked={formState.generate_structures === "true"}
              onCheckedChange={(v) =>
                handleValueChange("generate_structures", v ? "true" : "false")
              }
            />
            <ConfigSwitch
              label="Allow Nether"
              checked={formState.allow_nether === "true"}
              onCheckedChange={(v) =>
                handleValueChange("allow_nether", v ? "true" : "false")
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player & Network Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <ConfigInput
              label="Max Players"
              type="number"
              value={formState.max_players ?? "0"}
              onChange={(e) =>
                handleValueChange("max_players", e.target.value)
              }
            />
            <ConfigInput
              label="View Distance"
              type="number"
              value={formState.view_distance ?? "0"}
              onChange={(e) =>
                handleValueChange("view_distance", e.target.value)
              }
            />
            <ConfigInput
              label="Simulation Distance"
              type="number"
              value={formState.simulation_distance ?? "0"}
              onChange={(e) =>
                handleValueChange("simulation_distance", e.target.value)
              }
            />
            <ConfigInput
              label="Spawn Protection"
              type="number"
              value={formState.spawn_protection ?? "0"}
              onChange={(e) =>
                handleValueChange("spawn_protection", e.target.value)
              }
            />
            <ConfigInput
              label="Network Compression Threshold"
              type="number"
              value={formState.network_compression_threshold ?? "0"}
              onChange={(e) =>
                handleValueChange(
                  "network_compression_threshold",
                  e.target.value,
                )
              }
            />
            <ConfigSwitch
              label="Online Mode"
              checked={formState.online_mode === "true"}
              onCheckedChange={(v) =>
                handleValueChange("online_mode", v ? "true" : "false")
              }
            />
            <ConfigSwitch
              label="Spawn Animals"
              checked={formState.spawn_animals === "true"}
              onCheckedChange={(v) =>
                handleValueChange("spawn_animals", v ? "true" : "false")
              }
            />
            <ConfigSwitch
              label="Spawn Monsters"
              checked={formState.spawn_monsters === "true"}
              onCheckedChange={(v) =>
                handleValueChange("spawn_monsters", v ? "true" : "false")
              }
            />
            <ConfigSwitch
              label="Spawn NPCs"
              checked={formState.spawn_npcs === "true"}
              onCheckedChange={(v) =>
                handleValueChange("spawn_npcs", v ? "true" : "false")
              }
            />
            <ConfigSwitch
              label="Sync Chunk Writes"
              checked={formState.sync_chunk_writes === "true"}
              onCheckedChange={(v) =>
                handleValueChange("sync_chunk_writes", v ? "true" : "false")
              }
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is destructive. Changing the server type or version
              will permanently delete your current world data. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={proceedWithSave}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {isDeleting ? "Deleting World..." : "Continue & Delete World"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper Components
function ConfigInput(
  props: React.ComponentProps<typeof Input> & { label: string },
) {
  const { label, ...rest } = props; // avoid passing `label` to <input>
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input {...rest} />
    </div>
  );
}

type SelectOption = {
  label: string;
  value: string;
};

function ConfigSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ConfigSwitch({
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
}
