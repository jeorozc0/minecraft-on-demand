"use client";

import { useMemo, useState } from "react";
import { ChevronRight, PackageOpen, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ModLoader = "Fabric" | "Forge" | "NeoForge" | "Quilt" | "Vanilla";

type Mod = {
  id: string;
  name: string;
  version: string; // mod version
  loader: ModLoader;
  description?: string;
  homepage?: string;
  addedAt: string; // ISO
};

type Modpack = {
  id: string;
  name: string;
  version: string; // Minecraft version
  loader: ModLoader;
  mods: Mod[];
  updatedAt: string; // ISO
};

// ---- Mock catalog for search (pretend this comes from your API) ----
const MOD_REGISTRY: Omit<Mod, "addedAt">[] = [
  { id: "sodium", name: "Sodium", version: "0.5.9", loader: "Fabric", description: "Performance optimization mod for Fabric." },
  { id: "lithium", name: "Lithium", version: "0.12.1", loader: "Fabric", description: "General-purpose optimizations." },
  { id: "phosphor", name: "Phosphor", version: "0.8.1", loader: "Fabric", description: "Lighting engine performance." },
  { id: "journeymap", name: "JourneyMap", version: "5.10.0", loader: "Forge", description: "Real-time mapping in-game or in a web browser." },
  { id: "jei", name: "Just Enough Items (JEI)", version: "17.3.0", loader: "Forge", description: "Item and recipe viewer." },
  { id: "theoneprobe", name: "The One Probe", version: "10.0.1", loader: "Forge", description: "HUD to probe blocks/entities." },
  { id: "krypton", name: "Krypton", version: "0.2.4", loader: "Fabric", description: "Network optimization mod." },
  { id: "architectury", name: "Architectury API", version: "12.1.3", loader: "NeoForge", description: "Cross-loader modding API." },
  { id: "create", name: "Create", version: "0.5.1", loader: "NeoForge", description: "Mechanical power & contraptions." },
  { id: "quilted-fabric-api", name: "Quilted Fabric API", version: "9.0.0", loader: "Quilt", description: "API and hooks for Quilt." },
];

// ---- Mock modpacks (so the page has initial data by ID) ----
const MOCK_MODPACKS: Record<string, Omit<Modpack, "id">> = {
  "vanilla-plus": {
    name: "Vanilla Plus",
    version: "1.21.1",
    loader: "Vanilla",
    updatedAt: "2025-07-28T14:00:00.000Z",
    mods: [],
  },
  "skyfactory-ultra": {
    name: "SkyFactory Ultra",
    version: "1.20.6",
    loader: "Forge",
    updatedAt: "2025-07-15T10:00:00.000Z",
    mods: [
      { id: "jei", name: "Just Enough Items (JEI)", version: "17.3.0", loader: "Forge", addedAt: "2025-07-15T10:00:00.000Z" },
      { id: "journeymap", name: "JourneyMap", version: "5.10.0", loader: "Forge", addedAt: "2025-07-15T10:01:00.000Z" },
    ],
  },
  "fabric-fastpack": {
    name: "Fabric Fastpack",
    version: "1.21.0",
    loader: "Fabric",
    updatedAt: "2025-06-30T18:00:00.000Z",
    mods: [
      { id: "sodium", name: "Sodium", version: "0.5.9", loader: "Fabric", addedAt: "2025-06-30T18:00:00.000Z" },
      { id: "lithium", name: "Lithium", version: "0.12.1", loader: "Fabric", addedAt: "2025-06-30T18:02:00.000Z" },
    ],
  },
};

export default function ModpackDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const modpackId = decodeURIComponent(params.id);
  const initial = useMemo(() => {
    const base = MOCK_MODPACKS[modpackId] ?? {
      name: modpackId.replace(/-/g, " "),
      version: "1.21.1",
      loader: "Fabric" as ModLoader,
      mods: [],
      updatedAt: new Date().toISOString(),
    };
    return {
      id: modpackId,
      ...base,
    } as Modpack;
  }, [modpackId]);

  const [pack, setPack] = useState<Modpack>(initial);
  const [query, setQuery] = useState("");

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Simple search: name or id contains query
    const results = MOD_REGISTRY.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
    // (Optional) prioritize compatible loader results first
    results.sort((a, b) => {
      const aMatch = Number(a.loader === pack.loader || pack.loader === "Vanilla");
      const bMatch = Number(b.loader === pack.loader || pack.loader === "Vanilla");
      return bMatch - aMatch;
    });
    // Exclude already-added mods
    const existing = new Set(pack.mods.map((m) => m.id));
    return results.filter((m) => !existing.has(m.id));
  }, [query, pack.loader, pack.mods]);

  function handleAdd(modLite: Omit<Mod, "addedAt">) {
    // Add to top of list
    const newMod: Mod = { ...modLite, addedAt: new Date().toISOString() };
    setPack((p) => ({
      ...p,
      updatedAt: new Date().toISOString(),
      mods: [newMod, ...p.mods],
    }));
    setQuery("");
  }

  function handleDelete(modId: string) {
    setPack((p) => ({
      ...p,
      updatedAt: new Date().toISOString(),
      mods: p.mods.filter((m) => m.id !== modId),
    }));
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold break-words">{pack.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Manage mods for this modpack. Updated {dateFmt.format(new Date(pack.updatedAt))}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary">{pack.version}</Badge>
          <Badge>{pack.loader}</Badge>
        </div>
      </div>

      {/* Add/Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Add mods</CardTitle>
          <CardDescription>Search the registry and click to add.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search mods by name (e.g., Sodium, JEI, Create)"
                  className="pl-9"
                />
              </div>
              <Button variant="secondary" onClick={() => setQuery("")} disabled={!query.trim()}>
                Clear
              </Button>
            </div>

            {/* Results panel */}
            {query.trim() && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border bg-background shadow-md">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">
                    No results for “{query.trim()}”.
                  </div>
                ) : (
                  <ul className="max-h-80 divide-y overflow-auto">
                    {filtered.map((m) => (
                      <li key={m.id}>
                        <button
                          className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50"
                          onClick={() => handleAdd(m)}
                        >
                          <PackageOpen className="mt-0.5 size-5 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-medium">{m.name}</span>
                              <Badge variant="secondary">{m.version}</Badge>
                              <Badge>{m.loader}</Badge>
                            </div>
                            {m.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {m.description}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mods list */}
      <Card>
        <CardHeader>
          <CardTitle>Mods</CardTitle>
          <CardDescription>
            {pack.mods.length} {pack.mods.length === 1 ? "mod" : "mods"} in this pack.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pack.mods.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed py-14 text-center">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No mods yet. Use the search above to add your first mod.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Loader</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pack.mods.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{m.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{m.loader}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dateFmt.format(new Date(m.addedAt))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-destructive"
                          onClick={() => handleDelete(m.id)}
                          aria-label={`Delete ${m.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
