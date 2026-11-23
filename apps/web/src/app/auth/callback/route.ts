import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const searchParams = requestUrl.searchParams
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const nextParam = searchParams.get('next') ?? '/'
  const next = (nextParam.startsWith('/') && !nextParam.startsWith('//')) ? nextParam : '/'

  // Resolve true public origin (handles Docker, Railway, reverse proxies where internal port is 8080)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const isLocalEnv = process.env.NODE_ENV === 'development'

  const origin = (forwardedHost && !isLocalEnv)
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // Ensure the user exists in our public user table (for Google OAuth signups)
      const { data: dbUser } = await supabase
        .from('user')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (!dbUser) {
        // Insert new OAuth user
        const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'New User'
        
        await supabase.from('user').insert({
          id: data.user.id,
          name: fullName,
          email: data.user.email,
          email_verified: data.user.user_metadata?.email_verified ?? true,
        })
        
        // Redirect to origin for new users
        return NextResponse.redirect(`${origin}/`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
