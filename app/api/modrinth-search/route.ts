// pages/api/modrinth-search.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, version, categories } = req.query;

  if (!query || !version || !categories) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const facets = JSON.stringify([
    (categories as string).split(",").map((c) => `categories:${c.toLowerCase()}`),
    [`versions:${version}`],
    ["project_type:mod"],
  ]);

  const url = new URL("https://api.modrinth.com/v2/search");
  url.searchParams.set("query", query as string);
  url.searchParams.set("facets", facets);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "YourAppName/1.0 (contact@example.com)",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: await response.text() });
    }

    const data = await response.json();

    const results = (data.hits || []).map((hit: any) => ({
      title: hit.title,
      project_id: hit.project_id,
      slug: hit.slug,
    }));

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from Modrinth" });
  }
}
