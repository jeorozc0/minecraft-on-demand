// app/(protected)/modpacks/[id]/page.tsx
import ModpackDetailPage from "@/components/modpack-details-page";
import { fetchUserModpackById } from "@/lib/api/modpacks";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export default async function ModpackPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params; // ✅ await params

  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ["modpack", id],
    queryFn: () => fetchUserModpackById(id),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ModpackDetailPage modpackId={id} />
    </HydrationBoundary>
  );
}
