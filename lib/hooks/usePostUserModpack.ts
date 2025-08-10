"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modpack } from "@/lib/zod/modpacks"; // type from your schema
import { toast } from "sonner";
import { postUserModpack } from "../api/modpacks";

export type CreatePackInput = {
  modpackName: string;
  version: string;
  type: string
};

export function usePostUserModpack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePackInput) => {
      const payload: Partial<Modpack> = {
        modpackName: input.modpackName,
        type: input.type.toUpperCase() as Modpack["type"],
        version: input.version,
      };

      return await postUserModpack(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modpacks"] });
      toast.success("Modpack correctly created.")
    },
  });
}
