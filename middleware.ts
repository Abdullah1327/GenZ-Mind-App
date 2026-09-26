import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, let everything through (avoids build-time crash)
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  let user = null

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // IMPORTANT: always call getUser() to refresh the session — do not remove
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Session check failed — treat as unauthenticated, let layout handle it
    user = null
  }

  const publicRoutes = ['/', '/auth/signin', '/auth/signup']
  const isPublicRoute = publicRoutes.includes(pathname)
  const isApiRoute = pathname.startsWith('/api')

  // Always allow API routes through
  if (isApiRoute) {
    return supabaseResponse
  }

  // Not logged in → redirect to sign in (only for protected routes)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // Logged in but visiting sign-in or sign-up → redirect to sign in page
  // NOTE: Role-based routing (student vs instructor) is handled by the
  // individual layouts which read from the profiles table — NOT the middleware.
  // Doing role checks here based on user_metadata alone causes redirect loops
  // for seeded/admin instructor accounts that don't have metadata.role set.
  if (user && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/student/dashboard' // layouts will redirect instructors correctly
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
