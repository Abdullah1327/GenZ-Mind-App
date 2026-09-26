import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FileQuestion, BookOpen, Trophy, Zap, ArrowRight, Clock } from 'lucide-react'
import { COURSES } from '@/types'

export default async function StudentDashboardPage() {
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
    // ignore query failure
  }

  // Fetch stats safely
  let quizCount = 0
  let docCount = 0
  let avgScore = 0

  try {
    const [qRes, dRes, rRes] = await Promise.all([
      supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('quiz_results').select('percentage').eq('student_id', user.id),
    ])
    quizCount = qRes.count ?? 0
    docCount = dRes.count ?? 0
    const results = rRes.data ?? []
    if (results.length > 0) {
      avgScore = Math.round(
        results.reduce((sum: number, r: { percentage?: number }) => sum + (r.percentage || 0), 0) / results.length
      )
    }
  } catch {
    // If tables are empty or being set up, render cleanly with 0
  }

  const firstName =
    profile?.full_name?.split(' ')[0] ||
    user.user_metadata?.full_name?.split(' ')[0] ||
    'Learner'

  const stats = [
    { label: 'Quizzes Generated', value: quizCount ?? 0, icon: FileQuestion, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Documents Uploaded', value: docCount ?? 0, icon: BookOpen, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Avg Quiz Score', value: `${avgScore}%`, icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome back, <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="text-slate-500 mt-1">Ready to learn something amazing today? Let&apos;s dive in!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/student/quiz"
          id="quick-generate-quiz"
          className="group flex items-center gap-4 bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all"
        >
          <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Generate a Quiz</p>
            <p className="text-xs text-slate-500">Test your knowledge with AI</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/student/documents"
          id="quick-upload-doc"
          className="group flex items-center gap-4 bg-white rounded-2xl border border-cyan-100 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all"
        >
          <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Upload a Document</p>
            <p className="text-xs text-slate-500">Ask AI questions from your docs</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Course Topics */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Learning Tracks</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(COURSES).map(([key, course]) => (
            <Link
              key={key}
              href={`/student/quiz?course=${key}`}
              className={`group relative overflow-hidden bg-gradient-to-br ${course.color.replace('from-', 'from-').replace(' to-', '/10 to-')} rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div className="text-3xl mb-3">{course.icon}</div>
              <p className="font-semibold text-slate-900 text-sm mb-1">{course.label}</p>
              <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
              <div className="flex items-center gap-1 mt-3 text-xs font-medium text-indigo-600">
                <span>Start Quiz</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity placeholder */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
        </div>
        {(!quizCount || quizCount === 0) ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🚀</div>
            <p className="text-slate-500 text-sm">No activity yet. Generate your first quiz to get started!</p>
            <Link
              href="/student/quiz"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-white gradient-bg px-4 py-2 rounded-lg"
            >
              <Zap className="w-4 h-4" />
              Generate First Quiz
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Your recent quizzes will appear here.</p>
        )}
      </div>
    </div>
  )
}
