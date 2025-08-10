"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronRight, ExternalLink, PackageOpen, Search, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

import { Modpack as ApiModpack } from "@/lib/zod/modpacks";
import { fetchUserModpackById } from "@/lib/api/modpacks";
import { useSearchMods } from "@/lib/hooks/useSearchMods";
import Link from "next/link";
import { usePutUserModpack } from "@/lib/hooks/usePutUserModpack";

export default function ModpackDetailPage({ modpackId }: { modpackId: string }) {
  const { data: apiModpack, isLoading } = useQuery({
    queryKey: ["modpack", modpackId],
    queryFn: () => fetchUserModpackById(modpackId),
  });

  const [pack, setPack] = useState<ApiModpack | null>(null);
  const searchModsMutation = useSearchMods();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { mutate: updateModpack, isPending } = usePutUserModpack();

  useEffect(() => {
    if (apiModpack) {
      setPack(apiModpack);
    }
  }, [apiModpack]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }),
    []
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  const version = pack?.version;
  const type = pack?.type;

  useEffect(() => {
    if (debouncedQuery && version && type) {
      searchModsMutation.mutate({
        query: debouncedQuery,
        version,
        categories: [type],
      });
    }
  }, [debouncedQuery, version, type]);

  function handleAdd(modLite: { project_id: string; title: string; slug: string }) {
    if (!pack) return;
    const newMod = {
      projectId: modLite.project_id,
      slug: modLite.slug,
      title: modLite.title,
      addedAt: Date.now(),
    };
    setPack({
      ...pack,
      mods: [newMod, ...pack.mods],
    });
    setQuery("");
  }

  function handleDelete(modId: string) {
    if (!pack) return;
    setPack({
      ...pack,
      mods: pack.mods.filter((m) => m.projectId !== modId),
    });
  }

  if (isLoading || !pack) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-8 w-1/3 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="h-6 w-16 rounded bg-muted" />
            <div className="h-6 w-20 rounded bg-muted" />
          </div>
        </div>

        {/* Search bar skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="h-5 w-24 rounded bg-muted" />
            <CardDescription className="mt-2 h-4 w-40 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-10 flex-1 rounded bg-muted" />
              <div className="h-10 w-20 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Mods list skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="h-5 w-20 rounded bg-muted" />
            <CardDescription className="mt-2 h-4 w-32 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold break-words">{pack.modpackName}</h1>
          <p className="mt-1 text-muted-foreground">
            Manage mods for this modpack.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary">{pack.version}</Badge>
          <Badge>{pack.type}</Badge>
          <Button
            size="sm"
            onClick={() => pack && updateModpack(pack)}
            disabled={!pack || isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Add/Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Add mods</CardTitle>
          <CardDescription>Search Modrinth and click to add.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search mods by name..."
                  className="pl-9"
                />
              </div>
              <Button variant="secondary" onClick={() => setQuery("")} disabled={!query.trim()}>
                Clear
              </Button>
            </div>

            {query.trim() && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border bg-background shadow-md">
                {searchModsMutation.isPending && (
                  <div className="px-4 py-6 text-sm text-muted-foreground">Searching...</div>
                )}
                {searchModsMutation.isSuccess && searchModsMutation.data.length === 0 && (
                  <div className="px-4 py-6 text-sm text-muted-foreground">
                    No results for “{query.trim()}”.
                  </div>
                )}
                {searchModsMutation.isSuccess && searchModsMutation.data.length > 0 && (
                  <ul className="max-h-80 divide-y overflow-auto">
                    {searchModsMutation.data.map((m) => (
                      <li key={m.project_id}>
                        <button
                          className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50"
                          onClick={() => handleAdd(m)}
                        >
                          <PackageOpen className="mt-0.5 size-5 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-medium">{m.title}</span>
                              <Badge variant="secondary">{m.slug}</Badge>
                            </div>
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
              <p className="text-sm text-muted-foreground">
                No mods yet. Use the search above to add your first mod.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Loader</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pack.mods.map((m) => (
                    <TableRow key={m.projectId}>
                      <TableCell className="font-medium">{m.title}</TableCell>
                      <TableCell>
                        <Link
                          href={`https://modrinth.com/mod/${m.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="inline-block w-4 h-4 ml-1" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge>{pack.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dateFmt.format(new Date(m.addedAt))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-destructive"
                          onClick={() => handleDelete(m.projectId)}
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
