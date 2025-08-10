"use client";

import { useMutation } from "@tanstack/react-query";
import { ModrinthSearchResult, searchMods } from "../api/mods";

export function useSearchMods() {
  return useMutation<
    ModrinthSearchResult[],
    Error,
    { query: string; version: string; categories: string[] }
  >({
    mutationFn: ({ query, version, categories }) =>
      searchMods({ query, version, categories }),
  });
}
