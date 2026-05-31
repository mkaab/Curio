import { createBrowserClient } from '@supabase/ssr'

let client: any = null;

export function createClient() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  // During SSR (server-side rendering), always create a fresh client per-request
  if (typeof window === 'undefined') {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  // In the browser, cache as singleton to prevent connection leaks and multiple auth listeners
  if (!client) {
    client = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey
    );
  }
  return client;
}
