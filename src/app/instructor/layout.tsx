import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export const dynamic = 'force-dynamic'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'instructor') redirect('/student/dashboard')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        role="instructor"
        userName={profile?.full_name}
        userEmail={profile?.email}
      />
      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
