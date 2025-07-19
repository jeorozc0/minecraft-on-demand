import { useQuery } from "@tanstack/react-query";
import { useSupabaseSession } from "@/providers/SupabasProvider";
import type { RawServerResponse } from "./useServerStatus";

const fetchUserServer = async (userId: string): Promise<RawServerResponse | null> => {
  const res = await fetch(
    `https://lisifqtzud.execute-api.us-east-1.amazonaws.com/prod/servers/user/${userId}`,
    { cache: "no-store" },
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch user server: ${res.statusText}`);
  }

  return res.json();
};

export const useUserServer = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["userServer", userId],
    queryFn: () => fetchUserServer(userId!),
    enabled: !!userId,
    retry: false,
  });
};
