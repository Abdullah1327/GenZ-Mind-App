import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const isSQLiteMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('your_') ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('your_')

  let user = null
  let userRole = null
  let supabaseResponse = NextResponse.next({ request })

  if (isSQLiteMode) {
    const sessionCookie = request.cookies.get('sb-sqlite-session')?.value
    if (sessionCookie) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionCookie))
        if (session && session.expires_at > Date.now()) {
          user = session.user
          userRole = session.user.role
        }
      } catch (e) {
        // ignore
      }
    }
  } else {
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

    // Refresh session
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()
    user = supabaseUser

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      userRole = profile?.role
    }
  }

  const pathname = request.nextUrl.pathname

  // Allow API routes to be handled by their handlers directly
  if (pathname.startsWith('/api')) {
    return supabaseResponse
  }

  // Public routes that don't need auth
  const publicRoutes = ['/', '/auth/signin', '/auth/signup']
  const isPublicRoute = publicRoutes.includes(pathname)

  // If user is not logged in and trying to access a protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (user && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const url = request.nextUrl.clone()
    if (userRole === 'instructor') {
      url.pathname = '/instructor/dashboard'
    } else {
      url.pathname = '/student/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // Role-based protection for student routes
  if (pathname.startsWith('/student') && user) {
    if (userRole !== 'student') {
      const url = request.nextUrl.clone()
      url.pathname = '/instructor/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Role-based protection for instructor routes
  if (pathname.startsWith('/instructor') && user) {
    if (userRole !== 'instructor') {
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
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
