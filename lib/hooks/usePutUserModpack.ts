"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modpack } from "@/lib/zod/modpacks"; // type from your schema
import { putUserModpack } from "../api/modpacks";
import { toast } from "sonner";

type CreatePackInput = {
  modpackName: string;
  version: string;
  type: string
};

export function usePutUserPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePackInput) => {
      const payload: Partial<Modpack> = {
        modpackName: input.modpackName,
        mods: [],
        type: input.type.toUpperCase() as Modpack["type"],
        updatedAt: Date.now(),
        version: input.version,
      };

      return await putUserModpack(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modpacks"] });
      toast.success("Modpack correctly created.")
    },
  });
}
