import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not remove this call
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: string | null = null

  if (user) {
    // Role is stored in user_metadata (set during sign-up)
    userRole = user.user_metadata?.role || 'student'
  }

  const pathname = request.nextUrl.pathname

  // Allow API routes through
  if (pathname.startsWith('/api')) {
    return supabaseResponse
  }

  // Public routes that don't need auth
  const publicRoutes = ['/', '/auth/signin', '/auth/signup']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Not logged in → redirect to sign in
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // Logged in but on auth pages → redirect to dashboard
  if (user && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = userRole === 'instructor' ? '/instructor/dashboard' : '/student/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-based protection for student routes
  if (pathname.startsWith('/student') && user && userRole !== 'student') {
    const url = request.nextUrl.clone()
    url.pathname = '/instructor/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-based protection for instructor routes
  if (pathname.startsWith('/instructor') && user && userRole !== 'instructor') {
    const url = request.nextUrl.clone()
    url.pathname = '/student/dashboard'
    return NextResponse.redirect(url)
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
