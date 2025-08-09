import ModpacksPage from '@/components/modpacks-page';
import { fetchUserModpacks } from '@/lib/api/modpacks';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'

export default async function ModpackPage() {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ["modpacks"],
    queryFn: fetchUserModpacks,
  });


  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ModpacksPage />
    </HydrationBoundary>
  )
}
