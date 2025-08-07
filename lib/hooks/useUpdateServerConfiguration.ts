import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { useSupabaseSession } from "@/providers/SupabasProvider";
import { ServerConfigurationSchema } from "../types/config";
import { apiFetch, useAuthHeader } from "@/lib/api";

type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;

const updateServerConfiguration = async (config: ServerConfiguration, auth: ReturnType<typeof useAuthHeader>) => {
  return apiFetch(`/server-configuration`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
    authSession: auth,
  });
};

export const useUpdateConfiguration = () => {
  const queryClient = useQueryClient();
  const { session } = useSupabaseSession();
  const userId = session?.user.id;

  const auth = useAuthHeader();
  return useMutation({
    mutationFn: (conf: ServerConfiguration) => updateServerConfiguration(conf, auth),
    onSuccess: () => {
      toast.success("Configuration saved!", {
        description: "Your changes have been successfully applied.",
      });
      queryClient.invalidateQueries({ queryKey: ["config", userId] });
    },
    onError: (err) => {
      toast.error("Save failed", {
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
      });
    },
  });
};
