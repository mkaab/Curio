import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
            // Ignored in Server Components
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

  return createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      }
    }
  )
}
