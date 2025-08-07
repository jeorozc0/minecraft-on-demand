import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useSupabaseSession } from "@/providers/SupabasProvider";
import { apiFetch, useAuthHeader } from "@/lib/api";
import { ServerConfigurationSchema } from "../types/config";

type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;

class StatusError extends Error {
  public readonly status: number;

  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

// The function now returns Promise<ServerConfiguration | null>
const fetchServerConfiguration = async (auth: ReturnType<typeof useAuthHeader>): Promise<ServerConfiguration | null> => {
  try {
    const data = await apiFetch<unknown>(`/server-configuration`, { cache: "no-store", authSession: auth });
    return ServerConfigurationSchema.parse(data);
  } catch (e) {
    if (e instanceof Error && /\(404\)/.test(e.message)) {
      return null;
    }
    throw e;
  }
};

export const useMcServerConfiguration = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;
  const auth = useAuthHeader();
  // The query can now resolve to ServerConfiguration or null
  return useQuery<ServerConfiguration | null, Error>({
    queryKey: ["config", userId],
    queryFn: () => fetchServerConfiguration(auth),
    enabled: !!userId,
    retry: (failureCount, error) => {
      if (error instanceof StatusError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
