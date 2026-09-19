'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Save,
  LogOut,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { toast } from 'sonner'

export default function StudentProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Stats
  const [stats, setStats] = useState({ quizzes: 0, avg: 0, docs: 0 })

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

      const { data: results } = await supabase
        .from('quiz_results')
        .select('percentage')
        .eq('student_id', user.id)

      const { count: dCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const avg =
        results && results.length > 0
          ? Math.round(
              results.reduce((s: number, r: { percentage?: number }) => s + (r.percentage || 0), 0) /
                results.length
            )
          : 0

      setStats({
        quizzes: qCount ?? 0,
        avg,
        docs: dCount ?? 0,
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

      toast.success('Profile updated successfully!')
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
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-7 h-7 text-indigo-600" />
          My Profile
        </h1>
        <p className="text-slate-500 mt-1">Manage your account settings and personal details.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl gradient-bg text-white flex items-center justify-center text-3xl font-bold shadow-md flex-shrink-0">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'S'}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900">{profile?.full_name || 'Student'}</h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 w-fit mx-auto sm:mx-0">
                <GraduationCap className="w-3.5 h-3.5" /> Student Account
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
                Verified Student
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-xs text-slate-400">Quizzes Taken</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stats.quizzes}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-xs text-slate-400">Average Grade</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">{stats.avg}%</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-xs text-slate-400">Documents Studied</p>
            <p className="text-xl font-bold text-cyan-600 mt-1">{stats.docs}</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <h3 className="text-base font-bold text-slate-900 mb-6">Personal Details</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="student-full-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                id="student-full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="student-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="student-email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Email address is tied to authentication and cannot be edited.</p>
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white gradient-bg shadow-sm hover:opacity-95 transition-all disabled:opacity-50"
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
