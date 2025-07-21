import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useSupabaseSession } from "@/providers/SupabasProvider";
import { getAccessToken } from "@/lib/utils";
import { API_URL } from "../constants";


const serverInputSchema = z.object({
  userId: z.string(),
  type: z.string(),
  version: z.string(),
});
type ServerInput = z.infer<typeof serverInputSchema>;

export interface StartServerPayload {
  type: string;
  version: string;
}
export interface StartServerResponse {
  serverId: string;
}

const startServerRequest = async (
  input: ServerInput,
): Promise<StartServerResponse> => {
  serverInputSchema.parse(input);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await getAccessToken() },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Failed to start server: ${res.statusText}`);
  }

  const data = (await res.json()) as { serverId: string };
  return { serverId: data.serverId };
};



export const useStartServer = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;

  return useMutation<StartServerResponse, Error, StartServerPayload>({
    mutationFn: ({ type, version }) => {
      console.log({ userId, type, version });
      if (!userId) throw new Error("User not authenticated");
      return startServerRequest({ userId, type, version });
    },
  });
};

