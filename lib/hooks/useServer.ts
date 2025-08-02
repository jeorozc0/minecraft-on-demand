import { useMutation } from "@tanstack/react-query";
import { useSupabaseSession } from "@/providers/SupabasProvider";
import { getAccessToken } from "@/lib/utils";
import { API_URL } from "../constants";

// The payload is no longer needed for the frontend to send.
export interface StartServerResponse {
  serverId: string;
}

// The request function no longer needs an input payload.
const startServerRequest = async (): Promise<StartServerResponse> => {
  const res = await fetch(`${API_URL}/servers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: await getAccessToken(),
    },
    // The body is now empty; the backend will use the saved config.
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.message || `Failed to start server (${res.statusText})`;
    throw new Error(errorMessage);
  }

  return (await res.json()) as StartServerResponse;
};

export const useStartServer = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user.id;

  // The mutation no longer takes a payload.
  return useMutation<StartServerResponse, Error, void>({
    mutationFn: () => {
      if (!userId) throw new Error("User not authenticated");
      return startServerRequest();
    },
  });
};
