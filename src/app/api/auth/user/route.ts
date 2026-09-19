import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('sb-sqlite-session')?.value

    if (!sessionCookie) {
      return NextResponse.json({ data: { user: null }, error: null })
    }

    const session = JSON.parse(sessionCookie)
    if (session && session.expires_at > Date.now()) {
      return NextResponse.json({ data: { user: session.user }, error: null })
    }

    return NextResponse.json({ data: { user: null }, error: null })
  } catch (err: any) {
    console.error('Get user error:', err)
    return NextResponse.json({ data: { user: null }, error: null })
  }
}
