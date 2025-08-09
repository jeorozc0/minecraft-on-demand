"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, PackageOpen, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { fetchUserModpacks } from "@/lib/api/modpacks";
import { usePostUserModpack } from "@/lib/hooks/usePostUserModpack";
import { VersionSelect } from "./ui/minecraft-version-select";

type ModLoader = string;

const LOADER_OPTIONS: ModLoader[] = [
  "FABRIC",
  "FORGE",
  "NEOFORGE",
  "QUILT",
  "VANILLA",
];

export default function ModpacksPage() {
  const router = useRouter();
  const putUserPack = usePostUserModpack();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [version, setVersion] = useState<string>("");
  const [loader, setLoader] = useState<ModLoader>(LOADER_OPTIONS[0]);

  const { data: modpacks = [], isLoading } = useQuery({
    queryKey: ["modpacks"],
    queryFn: fetchUserModpacks,
  });

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }),
    []
  );

  function resetModal() {
    setName("");
    setVersion("");
    setLoader(LOADER_OPTIONS[0]);
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;

    putUserPack.mutate(
      {
        modpackName: trimmed,
        version,
        type: loader,
      },
      {
        onSuccess: (created) => {
          setOpen(false);
          resetModal();
          router.push(`/modpacks/${created.modpackId}`);
        },
      }
    );
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
                  <VersionSelect value={version} onChangeAction={setVersion} />
                </div>

                <div className="grid gap-2">
                  <Label>Mod loader</Label>
                  <Select
                    value={loader}
                    onValueChange={(v) => setLoader(v)}
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
                disabled={!name.trim() || putUserPack.isPending}
              >
                {putUserPack.isPending ? "Creating..." : "Create"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* ✅ Show loading or empty state */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="h-full transition-shadow hover:shadow-md animate-pulse"
            >
              <CardHeader className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-muted" />
                  <div className="h-5 w-32 rounded bg-muted" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-12 rounded bg-muted" />
                  <div className="h-5 w-14 rounded bg-muted" />
                </div>
              </CardHeader>

              <CardContent>
                <div className="h-4 w-3/4 rounded bg-muted" />
              </CardContent>

              <CardFooter className="justify-between">
                <div className="h-4 w-10 rounded bg-muted" />
                <div className="h-4 w-4 rounded bg-muted" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : modpacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-lg bg-muted/30">
          <PackageOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">No modpacks found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            You haven’t created any modpacks yet. Get started by creating your first one.
          </p>
          <Button
            className="mt-6"
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Modpack
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modpacks.map((pack) => (
            <Link
              key={pack.modpackId}
              href={`/modpacks/${pack.modpackId}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PackageOpen className="size-5 text-muted-foreground" />
                    {pack.modpackName}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{pack.version}</Badge>
                    <Badge>{pack.type}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="text-sm text-muted-foreground">
                  {pack.mods} mods • Updated{" "}
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
      )}
    </div>
  );
}
