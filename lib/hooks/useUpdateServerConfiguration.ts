import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { API_URL } from "../constants";
import { getAccessToken } from "@/lib/utils";
import { ServerConfigurationSchema } from "../types/config";

type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;

const updateServerConfiguration = async (config: ServerConfiguration) => {
  const res = await fetch(`${API_URL}/server-configuration`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: await getAccessToken(),
    },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.message || `Failed to update configuration (${res.status})`;
    throw new Error(errorMessage);
  }

  return res.json();
};

export const useUpdateConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateServerConfiguration,
    onSuccess: () => {
      toast.success("Configuration saved!", {
        description: "Your changes have been successfully applied.",
      });
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
    onError: (err) => {
      toast.error("Save failed", {
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
      });
    },
  });
};
