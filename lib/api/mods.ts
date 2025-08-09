export type ModrinthSearchResult = {
  title: string;
  project_id: string;
  slug: string;
};

export async function searchMods({
  query,
  version,
  categories,
}: {
  query: string;
  version: string;
  categories: string[];
}): Promise<ModrinthSearchResult[]> {
  const params = new URLSearchParams({
    query,
    version,
    categories: categories.join(","),
  });

  const res = await fetch(`/api/modrinth-search?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to search mods: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
