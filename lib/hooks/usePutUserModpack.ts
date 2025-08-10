"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modpack } from "@/lib/zod/modpacks";
import { toast } from "sonner";
import { putUserModpack } from "@/lib/api/modpacks";
import { fetchUserModpackById } from "@/lib/api/modpacks";

export function usePutUserModpack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Modpack) => putUserModpack(payload),
    onSuccess: async (res) => {
      const modpackIdFromLocation = res.location.split("/modpacks/")[1];
      const full = await fetchUserModpackById(modpackIdFromLocation);
      queryClient.setQueryData(["modpack", modpackIdFromLocation], full);
      queryClient.invalidateQueries({ queryKey: ["modpacks"] });

      toast.success(`"${full.modpackName}" saved successfully.`);
    },
    onError: () => {
      toast.error("Failed to save modpack.");
    },
  });
}
