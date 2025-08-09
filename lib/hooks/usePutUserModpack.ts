"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modpack } from "@/lib/zod/modpacks";
import { toast } from "sonner";
import { putUserModpack } from "@/lib/api/modpacks";
import { fetchUserModpackById } from "@/lib/api/modpacks";

export function usePutUserModpack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modpack: Modpack) => putUserModpack(modpack),
    onSuccess: async (res) => {
      // Refetch the full modpack so cache is correct
      const full = await fetchUserModpackById(res.modpackId);
      queryClient.setQueryData(["modpack", res.modpackId], full);
      queryClient.invalidateQueries({ queryKey: ["modpacks"] });

      toast.success(`"${full.modpackName}" saved successfully.`);
    },
    onError: () => {
      toast.error("Failed to save modpack.");
    },
  });
}
