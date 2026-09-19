import { NextRequest, NextResponse } from 'next/server'
import { queryGet, queryRun } from '@/lib/database/sqlite'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { data: { user: null }, error: { message: 'Email and password are required' } },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await queryGet('SELECT * FROM users WHERE email = ?', [email])
    if (existingUser) {
      return NextResponse.json(
        { data: { user: null }, error: { message: 'User already exists' } },
        { status: 400 }
      )
    }

    // Generate UUID
    const userId = crypto.randomUUID()
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')

    // Save to users table
    await queryRun(
      'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
      [userId, email, hashedPassword]
    )

    // Save to profiles table (as in Supabase trigger)
    await queryRun(
      'INSERT INTO profiles (id, full_name, email, role) VALUES (?, ?, ?, ?)',
      [userId, fullName || '', email, role || 'student']
    )

    const sessionUser = {
      id: userId,
      email,
      full_name: fullName || '',
      role: role || 'student',
    }

    const session = {
      user: sessionUser,
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    const cookieStore = await cookies()
    cookieStore.set('sb-sqlite-session', JSON.stringify(session), {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: false,
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
    console.error('Signup error:', err)
    return NextResponse.json(
      { data: { user: null }, error: { message: err.message || 'Signup failed' } },
      { status: 500 }
    )
  }
}
