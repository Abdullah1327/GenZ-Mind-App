import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('sb-sqlite-session')
    return NextResponse.json({ error: null })
  } catch (err: any) {
    console.error('Signout error:', err)
    return NextResponse.json({ error: { message: err.message || 'Signout failed' } }, { status: 500 })
  }
}
