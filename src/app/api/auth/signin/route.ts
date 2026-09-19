import { NextRequest, NextResponse } from 'next/server'
import { queryGet } from '@/lib/database/sqlite'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { data: { user: null }, error: { message: 'Email and password are required' } },
        { status: 400 }
      )
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')

    // Find user in users table
    const user = await queryGet(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, hashedPassword]
    )

    if (!user) {
      return NextResponse.json(
        { data: { user: null }, error: { message: 'Invalid credentials. Please try again.' } },
        { status: 400 }
      )
    }

    // Fetch user profile to get full_name and role
    const profile = await queryGet('SELECT * FROM profiles WHERE id = ?', [user.id])

    const sessionUser = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || '',
      role: profile?.role || 'student',
    }

    const session = {
      user: sessionUser,
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('sb-sqlite-session', JSON.stringify(session), {
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      httpOnly: false, // Make it readable by client-side if needed (middleware also reads it)
      sameSite: 'lax',
    })

    return NextResponse.json({
      data: {
        user: sessionUser,
        session,
      },
      error: null,
    })
  } catch (err: any) {
    console.error('Signin error:', err)
    return NextResponse.json(
      { data: { user: null }, error: { message: err.message || 'Signin failed' } },
      { status: 500 }
    )
  }
}
