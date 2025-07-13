import { createServerClient } from '@supabase/ssr'
import {Database} from "@/lib/types";

export async function createServerAdminClient() {

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.PRIVATE_SUPABASE_SERVICE_KEY!,
        {
            cookies: {
                getAll: () => [],
                setAll: () => {},
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            db: {
                schema: 'public'
            },
        }
    )
}