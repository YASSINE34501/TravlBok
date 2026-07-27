import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseStorageConfig } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Service-role Supabase client — full read/write access to every bucket,
 * bypassing Storage RLS policies. Only ever imported from server-only
 * modules (this file itself is "server-only"-guarded); never send this
 * client, its key, or anything derived from it to the browser.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (cached) return cached;
  const { url, serviceRoleKey } = getSupabaseStorageConfig();
  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
