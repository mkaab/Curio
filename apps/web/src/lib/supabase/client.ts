import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
