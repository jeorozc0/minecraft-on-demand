import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { useSupabaseSession } from "@/providers/SupabasProvider";
import { ServerConfigurationSchema } from "../types/config";
import { apiFetch, useAuthHeader } from "@/lib/api";

type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;

const updateServerConfiguration = async (
  config: ServerConfiguration,
  auth: ReturnType<typeof useAuthHeader>
) => {
  return apiFetch(`/server-configuration`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
    authSession: auth,
  });
};

export const useUpdateConfiguration = () => {
  const qc = useQueryClient();
  const { session } = useSupabaseSession();
  const userId = session?.user.id;
  const key = ["config", userId ?? "anon"] as const;

  const auth = useAuthHeader();
  return useMutation({
    mutationFn: (next: ServerConfiguration) => updateServerConfiguration(next, auth),

    async onMutate(next) {
      await qc.cancelQueries({ queryKey: key as unknown as string[] });
      const prev = qc.getQueryData<ServerConfiguration | null>(key as unknown as string[]);
      qc.setQueryData(key as unknown as string[], next); // optimistic UI
      return { prev };
    },

    onError: (err, _next, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(key as unknown as string[], ctx.prev);
      }
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : "An unknown error occurred.",
      });
    },

    onSuccess: (saved, next) => {
      qc.setQueryData(key as unknown as string[], (saved as ServerConfiguration) ?? next);
      toast.success("Configuration saved!", {
        description: "Your changes have been successfully applied.",
      });
    },

    onSettled: () => {
      qc.invalidateQueries({
        queryKey: ["config", userId ?? "anon"],
        exact: true,
        refetchType: "all",   // refetch active + inactive queries
      });
    },
  });
};
