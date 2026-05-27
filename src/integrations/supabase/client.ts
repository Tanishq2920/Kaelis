/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing = [
      ...(!url ? ["VITE_SUPABASE_URL"] : []),
      ...(!anonKey ? ["VITE_SUPABASE_ANON_KEY"] : []),
    ];
    console.warn(
      `[Supabase] Missing environment variable(s): ${missing.join(", ")}. Using mock fallback client to prevent app crash.`,
    );
    return createMockSupabase();
  }

  try {
    return createClient<Database>(url, anonKey, {
      auth: {
        storage: typeof window !== "undefined" ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (error) {
    console.error("[Supabase] Failed to initialize real Supabase client:", error);
    return createMockSupabase();
  }
}

function createMockSupabase() {
  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: null, error: null }),
  };

  return {
    from: () => mockQueryBuilder,
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithOtp: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
    },
  } as any;
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
