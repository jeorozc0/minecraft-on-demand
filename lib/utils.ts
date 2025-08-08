import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "@/utils/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Lightweight access token helper. Accept an optional session to avoid fetching per call.
export async function getAccessToken(sessionArg?: Session | null) {
  if (sessionArg) {
    const accessToken = sessionArg.access_token
    return accessToken ? `Bearer ${accessToken}` : ""
  }
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  return accessToken ? `Bearer ${accessToken}` : ""
}
