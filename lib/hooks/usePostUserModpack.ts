"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postUserModpack } from "../api/modpacks";
import { CreatePackInput } from "@/lib/types/modpacks";

// CreatePackInput moved to shared types to avoid circular imports

export function usePostUserModpack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePackInput) => {
      const payload: CreatePackInput = {
        modpackName: input.modpackName,
        type: input.type.toUpperCase(),
        version: input.version,
      };

      return await postUserModpack(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modpacks"] });
      toast.success("Modpack correctly created.");
    },
  });
}
