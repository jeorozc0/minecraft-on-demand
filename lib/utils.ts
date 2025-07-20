import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {createClient} from "@/utils/supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getAccessToken() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token;
  return accessToken ? `Bearer ${accessToken}` : "";
}