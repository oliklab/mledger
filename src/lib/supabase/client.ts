import { createBrowserClient } from '@supabase/ssr'
import { ClientType, SaasClient } from "@/lib/supabase/saas";
import { Database } from "@/storage/types";

export function createSPAClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function NewSPASassClient() {
  const client = createSPAClient();
  return new SaasClient(client, ClientType.SPA);
}
