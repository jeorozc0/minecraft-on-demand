import ConfigurationPage from '@/components/config-page'
import { fetchUserModpacks } from '@/lib/api/modpacks';
import fetchServerConfiguration from '@/lib/api/server-config'
import { createClient } from '@/utils/supabase/server';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'

export default async function ConfigPage() {
  const qc = new QueryClient();
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  await qc.prefetchQuery({
    queryKey: ["config", userId ?? "anon"],
    queryFn: fetchServerConfiguration,
  });

  await qc.prefetchQuery({
    queryKey: ["modpacks"],
    queryFn: fetchUserModpacks,
  });

  return (
    // Neat! Serialization is now as easy as passing props.
    // HydrationBoundary is a Client Component, so hydration will happen there.
    <HydrationBoundary state={dehydrate(qc)}>
      <ConfigurationPage />
    </HydrationBoundary>
  )
}
