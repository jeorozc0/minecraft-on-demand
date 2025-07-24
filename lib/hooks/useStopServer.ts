import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useSupabaseSession } from "@/providers/SupabasProvider";
import { getAccessToken } from "@/lib/utils";
import { API_URL } from "../constants";

const stopServerInputSchema = z.object({
  serverId: z.string(),
});

type StopServerInput = z.infer<typeof stopServerInputSchema>;

interface StopServerResponse {
  serverId: string;
}

const stopServerRequest = async (
  input: StopServerInput,
): Promise<StopServerResponse> => {
  stopServerInputSchema.parse(input);

  const res = await fetch(`${API_URL}/${input.serverId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: await getAccessToken(),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to stop server: ${res.statusText}`);
  }

  return (await res.json()) as StopServerResponse;
};

export const useStopServer = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;

  return useMutation<StopServerResponse, Error, StopServerInput>({
    mutationFn: (variables) => {
      if (!userId) {
        return Promise.reject(new Error("User not authenticated"));
      }
      return stopServerRequest(variables);
    },
  });
};
