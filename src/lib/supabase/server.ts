import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ClientType, SaasClient } from "@/lib/supabase/saas";
import { Database } from "@/storage/types";

export async function NewSSRClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      }
    }
  )
}



export async function NewSSRSassClient() {
  const client = await NewSSRClient();
  return new SaasClient(client, ClientType.SERVER);
}
