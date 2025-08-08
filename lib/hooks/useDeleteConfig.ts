import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_URL } from "../constants";
import { getAccessToken } from "@/lib/utils";

const deleteWorldRequest = async (): Promise<void> => {
  const res = await fetch(`${API_URL}/storage`, {
    method: "DELETE",
    headers: {
      Authorization: await getAccessToken(),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.message || `Failed to delete world (${res.status})`;
    throw new Error(errorMessage);
  }
};

export const useDeleteConfig = () => {
  return useMutation({
    mutationFn: deleteWorldRequest,
    onSuccess: () => {
      toast.success("World data deleted successfully.");
    },
    onError: (err) => {
      toast.error("Failed to delete world", {
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
      });
    },
  });
};
