import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export const dynamic = 'force-dynamic'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  let profile = null
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    profile = data
  } catch {
    // Profile query failed — fall back to user_metadata
  }

  const role = profile?.role || user.user_metadata?.role || 'student'
  if (role === 'instructor') redirect('/instructor/dashboard')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        role="student"
        userName={profile?.full_name || user.user_metadata?.full_name || 'Student'}
        userEmail={profile?.email || user.email}
      />
      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
