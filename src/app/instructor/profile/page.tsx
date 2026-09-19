'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  BookOpen,
  Calendar,
  Save,
  LogOut,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Award,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { toast } from 'sonner'

export default function InstructorProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Stats
  const [stats, setStats] = useState({ quizzes: 0, assignments: 0, total: 0 })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name || '')
      }

      // Load counts
      const { count: qCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: aCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', user.id)

      const quizzes = qCount ?? 0
      const assignments = aCount ?? 0

      setStats({
        quizzes,
        assignments,
        total: quizzes + assignments,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      const supabase = createClient()
      await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          full_name: fullName.trim(),
          email: profile.email,
          role: profile.role,
          updated_at: new Date().toISOString(),
        })

      toast.success('Instructor profile updated successfully!')
      setProfile((prev) => (prev ? { ...prev, full_name: fullName.trim() } : prev))
    } catch (err: any) {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-7 h-7 text-purple-600" />
          Instructor Profile
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your instructor account, credentials, and publishing metrics.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-md flex-shrink-0">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'I'}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900">
                {profile?.full_name || 'Instructor'}
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 w-fit mx-auto sm:mx-0">
                <BookOpen className="w-3.5 h-3.5" /> Instructor Account
              </span>
            </div>
            <p className="text-sm text-slate-500">{profile?.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Educator
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-xs text-slate-400">Quizzes Published</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stats.quizzes}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-xs text-slate-400">Assignments Published</p>
            <p className="text-xl font-bold text-purple-600 mt-1">{stats.assignments}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-xs text-slate-400">Total Content Created</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{stats.total}</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <h3 className="text-base font-bold text-slate-900 mb-6">Instructor Details</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="instructor-full-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                id="instructor-full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="instructor-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="instructor-email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Email address is tied to authentication and cannot be edited.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
