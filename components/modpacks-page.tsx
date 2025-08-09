"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, PackageOpen, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import fetchUserModpacks from "@/lib/api/modpacks";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ModLoader = "Fabric" | "Forge" | "NeoForge" | "Quilt" | "Vanilla";
type Modpack = {
  id: string;
  name: string;
  version: string;
  loader: ModLoader;
  modsCount: number;
  updatedAt: string;
};

const VERSION_OPTIONS = ["1.21.1", "1.21.0", "1.20.6", "1.20.1"];
const LOADER_OPTIONS: ModLoader[] = [
  "Fabric",
  "Forge",
  "NeoForge",
  "Quilt",
  "Vanilla",
];

const INITIAL_DATA: Modpack[] = [
  {
    id: "vanilla-plus",
    name: "Vanilla Plus",
    version: "1.21.1",
    loader: "Vanilla",
    modsCount: 14,
    updatedAt: "2025-07-28T14:00:00.000Z",
  },
  {
    id: "skyfactory-ultra",
    name: "SkyFactory Ultra",
    version: "1.20.6",
    loader: "Forge",
    modsCount: 86,
    updatedAt: "2025-07-15T10:00:00.000Z",
  },
  {
    id: "fabric-fastpack",
    name: "Fabric Fastpack",
    version: "1.21.0",
    loader: "Fabric",
    modsCount: 22,
    updatedAt: "2025-06-30T18:00:00.000Z",
  },
];

export default function ModpacksPage() {
  const router = useRouter();
  const [modpacks, setModpacks] = useState<Modpack[]>(INITIAL_DATA);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [version, setVersion] = useState<string>(VERSION_OPTIONS[0]);
  const [loader, setLoader] = useState<ModLoader>(LOADER_OPTIONS[0]);

  const { data: fetchedModpacks } = useQuery({
    queryKey: ["modpacks"],
    queryFn: fetchUserModpacks,
  });

  console.log("Fetched modpacks from API:", fetchedModpacks);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }),
    []
  );

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function resetModal() {
    setName("");
    setVersion(VERSION_OPTIONS[0]);
    setLoader(LOADER_OPTIONS[0]);
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const id = slugify(trimmed) || `modpack-${Date.now()}`;
    const newPack: Modpack = {
      id,
      name: trimmed,
      version,
      loader,
      modsCount: 0,
      updatedAt: new Date().toISOString(),
    };

    setModpacks((prev) => [newPack, ...prev]);
    setOpen(false);
    resetModal();
    router.push(`/modpacks/${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modpacks</h1>
          <p className="mt-1 text-muted-foreground">
            Create, view, and manage your modpacks.
          </p>
        </div>

        <AlertDialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetModal();
          }}
        >
          <AlertDialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New Modpack
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create modpack</AlertDialogTitle>
              <AlertDialogDescription>
                Name your modpack and pick the Minecraft version + mod loader.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="grid gap-4 px-1">
              <div className="grid gap-2">
                <Label htmlFor="mp-name">Name</Label>
                <Input
                  id="mp-name"
                  placeholder="e.g., SkyFactory Ultra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Version</Label>
                  <Select value={version} onValueChange={setVersion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {VERSION_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Mod loader</Label>
                  <Select
                    value={loader}
                    onValueChange={(v) => setLoader(v as ModLoader)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select loader" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOADER_OPTIONS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={resetModal}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCreate}
                disabled={!name.trim()}
              >
                Create
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modpacks.map((pack) => (
          <Link key={pack.id} href={`/modpacks/${pack.id}`} className="group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PackageOpen className="size-5 text-muted-foreground" />
                  {pack.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">{pack.version}</Badge>
                  <Badge>{pack.loader}</Badge>
                </div>
              </CardHeader>

              <CardContent className="text-sm text-muted-foreground">
                {pack.modsCount} mods • Updated{" "}
                {dateFmt.format(new Date(pack.updatedAt))}
              </CardContent>

              <CardFooter className="justify-between">
                <span className="text-sm">Open</span>
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
