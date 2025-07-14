"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

type Ctx = {
  supabase: ReturnType<typeof createClient>;
  session: Session | null;
};

const SupabaseCtx = createContext<Ctx | undefined>(undefined);

export function SupabaseProvider({
  initialSession,
  children,
}: {
  initialSession: Session | null;
  children: ReactNode;
}) {
  // memoise one browser client for the lifetime of this tab
  const [supabase] = useState(createClient);
  const [session, setSession] = useState(initialSession);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) =>
      setSession(newSession),
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <SupabaseCtx.Provider value={{ supabase, session }}>
      {children}
    </SupabaseCtx.Provider>
  );
}

export const useSupabaseSession = () => {
  const ctx = useContext(SupabaseCtx);
  if (!ctx)
    throw new Error("useSupabaseSession must be used inside SupabaseProvider");
  return ctx;
};
