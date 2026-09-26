import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow API routes and static assets through immediately
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  // Safety check: if env vars are missing, let everything through
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase env vars — skipping auth check')
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

    // IMPORTANT: getUser() verifies the JWT server-side — do not remove
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    // If session check fails, treat as unauthenticated but don't crash
    console.error('[Middleware] Session check failed:', err)
    user = null
  }

  const userRole: string = user?.user_metadata?.role || 'student'

  // Public routes — always accessible
  const publicRoutes = ['/', '/auth/signin', '/auth/signup']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Not logged in → redirect to sign in (only for protected routes)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    // Clear the target param to avoid redirect loops
    url.searchParams.delete('redirectedFrom')
    return NextResponse.redirect(url)
  }

  // Logged in but on auth pages → redirect to their dashboard
  if (user && isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = userRole === 'instructor' ? '/instructor/dashboard' : '/student/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-based protection — only redirect if we're CERTAIN about the role
  if (user && userRole) {
    if (pathname.startsWith('/student') && userRole === 'instructor') {
      const url = request.nextUrl.clone()
      url.pathname = '/instructor/dashboard'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/instructor') && userRole === 'student') {
      const url = request.nextUrl.clone()
      url.pathname = '/student/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
