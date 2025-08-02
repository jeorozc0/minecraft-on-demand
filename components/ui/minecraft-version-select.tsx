"use client";

import { useEffect } from "react";

import { Loader2 } from "lucide-react";
import { useMinecraftVersions } from "@/lib/hooks/useMinecraftServer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Label } from "./label";

interface VersionSelectProps {
  value: string;
  onChangeAction: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function VersionSelect({
  value,
  onChangeAction,
  className = "",
  disabled
}: VersionSelectProps) {
  const { data: versions, isLoading, isError } = useMinecraftVersions();

  // Set a default version if none selected and versions are loaded
  useEffect(() => {
    if (!value && versions && versions.length > 0) {
      onChangeAction(versions[0]);
    }
  }, [value, versions, onChangeAction]);

  return (
    <div className="space-y-2">
      <Label>Version</Label>
      <Select value={value} onValueChange={onChangeAction} disabled={disabled}>
        <SelectTrigger className={className}>
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading versions...</span>
            </div>
          ) : (
            <SelectValue placeholder="Select Minecraft version" />
          )}
        </SelectTrigger>
        <SelectContent>
          {isError ? (
            <div className="p-2 text-center text-red-500">
              Failed to load versions
            </div>
          ) : (
            versions?.map((version) => (
              <SelectItem key={version} value={version}>
                {version}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
