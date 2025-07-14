
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useSupabaseSession } from "@/providers/SupabasProvider";

const SERVER_URL = "https://lisifqtzud.execute-api.us-east-1.amazonaws.com/prod/servers";

const serverInputSchema = z.object({
  userId: z.string().uuid(),
  type: z.string(),
  version: z.string(),
});

type ServerInput = z.infer<typeof serverInputSchema>;

export type StartServerResponse =
  | { success: true }
  | {
    error: {
      type: "CONFLICT" | "SERVER";
      message: string;
    };
  };

const startServerRequest = async (
  input: ServerInput,
): Promise<StartServerResponse> => {
  serverInputSchema.parse(input);
  console.log(JSON.stringify(input))
  console.log(SERVER_URL)



  const res = await fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    if (res.status === 409) {
      return {
        error: { type: "CONFLICT", message: "Server is already running" },
      };
    }
    throw new Error("Failed to start server");
  }

  return { success: true };
};

type StartServerParams = Omit<ServerInput, "userId">;

export const useStartServer = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: ({ type, version }: StartServerParams) => {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      return startServerRequest({ userId, type, version });
    },
    onError: (err: unknown) => ({
      error: {
        type: "SERVER",
        message: err instanceof Error ? err.message : "Failed to start server",
      },
    }),
  });
};
