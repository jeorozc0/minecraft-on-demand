import { ModrinthV2Client } from "@xmcl/modrinth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const version = searchParams.get("version");
  const categories = searchParams.get("categories");

  if (!query || !version || !categories) {
    return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
  }

  try {
    const client = new ModrinthV2Client();

    const facets = JSON.stringify([
      categories.split(",").map((c) => `categories:${c.toLowerCase()}`),
      [`versions:${version}`],
      ["project_type:mod"],
    ]);

    const result = await client.searchProjects({
      query,
      facets,
    });

    const simplified = result.hits.map((hit) => ({
      title: hit.title,
      project_id: hit.project_id,
      slug: hit.slug,
    }));

    return new Response(JSON.stringify(simplified), { status: 200 });
  } catch (error) {
    console.error("Modrinth search error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch from Modrinth" }), { status: 500 });
  }
}
