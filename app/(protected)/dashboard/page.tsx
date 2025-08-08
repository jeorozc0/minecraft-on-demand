import Dashboard from '@/components/dashboard-page'
import fetchServerConfiguration from '@/lib/api/server-config'
import fetchServerStatus from '@/lib/api/server-status'
import { createClient } from '@/utils/supabase/server';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'

export default async function DashboardPage() {
  const qc = new QueryClient();
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  await qc.prefetchQuery({
    queryKey: ["config", userId ?? "anon"],
    queryFn: fetchServerConfiguration,
  });

  await qc.prefetchQuery({
    queryKey: ['serverStatus'],
    queryFn: fetchServerStatus,
  })


  return (
    // HydrationBoundary is a Client Component, so hydration will happen there.
    <HydrationBoundary state={dehydrate(qc)}>
      <Dashboard />
    </HydrationBoundary>
  )
}
