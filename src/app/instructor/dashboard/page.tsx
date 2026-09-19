import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FileQuestion, BookOpen, Activity, ArrowRight, PlusCircle, Clock, Users, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InstructorDashboardPage() {
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

  // Stats
  const { count: quizCount } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: assignmentCount } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .eq('instructor_id', user.id)

  // Fetch student responses submitted for instructor's quizzes via Supabase
  // We join quiz_results → quizzes → profiles using Supabase's nested select
  const { data: studentResponses } = await supabase
    .from('quiz_results')
    .select(`
      id, quiz_id, student_id, score, total_questions, percentage, completed_at,
      quizzes!inner (topic, course, google_form_url, user_id),
      profiles (full_name, email)
    `)
    .eq('quizzes.user_id', user.id)
    .order('completed_at', { ascending: false })

  const responses = (studentResponses || []).map((r: any) => ({
    id: r.id,
    quiz_id: r.quiz_id,
    student_id: r.student_id,
    score: r.score,
    total_questions: r.total_questions,
    percentage: r.percentage,
    completed_at: r.completed_at,
    quiz_topic: r.quizzes?.topic,
    quiz_course: r.quizzes?.course,
    google_form_url: r.quizzes?.google_form_url,
    student_name: r.profiles?.full_name || 'Student',
    student_email: r.profiles?.email || 'No email',
  }))

  const firstName = profile?.full_name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || 'Instructor'

  const stats = [
    { label: 'Quizzes Generated', value: quizCount ?? 0, icon: FileQuestion, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Assignments Generated', value: assignmentCount ?? 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Student Responses', value: responses.length, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Content', value: (quizCount ?? 0) + (assignmentCount ?? 0), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome back, Instructor{' '}
          <span style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {firstName}
          </span>{' '}
          👨‍🏫
        </h1>
        <p className="text-slate-500 mt-1">Create powerful learning content with AI — quizzes, assignments, and more.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Student Quiz Responses & Google Form Submissions */}
      <div id="responses" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Student Quiz Responses &amp; Google Form Submissions
              </h2>
              <p className="text-xs text-slate-500">
                Live responses received from students via shared quiz links and Google Forms.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full w-fit">
            {responses.length} Submissions Received
          </span>
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 space-y-2">
            <p>No student submissions received yet.</p>
            <p className="text-slate-400">
              Create an AI quiz, link a Google Form or share the direct student link, and student responses will appear right here!
            </p>
            <div className="pt-2">
              <Link
                href="/instructor/quiz"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white gradient-bg px-3.5 py-1.5 rounded-lg shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Create &amp; Share Quiz
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Student</th>
                  <th className="py-2.5 px-3">Quiz Topic</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Form / Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((res: any) => {
                  const isPassing = (res.percentage || 0) >= 70
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{res.student_name}</p>
                        <p className="text-[11px] text-slate-400">{res.student_email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{res.quiz_topic}</span>
                        <span className="block text-[10px] text-slate-400 capitalize">{res.quiz_course}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            isPassing
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {res.score} / {res.total_questions} ({res.percentage}%)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(res.completed_at).toLocaleDateString()}{' '}
                        {new Date(res.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {res.google_form_url ? (
                          <a
                            href={res.google_form_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md border border-purple-200 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Google Form
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">Direct Link</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Quiz Generator */}
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Generate AI Quiz</h2>
              <p className="text-sm text-slate-500 mt-0.5">Create quizzes based on course topics and difficulty levels.</p>
            </div>
          </div>
          <Link
            href="/instructor/quiz"
            id="instructor-generate-quiz"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-bg py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-4 h-4" />
            Generate Quiz
          </Link>
        </div>

        {/* Assignment Generator */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Generate AI Assignment</h2>
              <p className="text-sm text-slate-500 mt-0.5">Create customized assignments with deliverables and rubrics.</p>
            </div>
          </div>
          <Link
            href="/instructor/assignment"
            id="instructor-generate-assignment"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-purple-600 py-2.5 rounded-xl hover:bg-purple-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Generate Assignment
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
        </div>

        {(!quizCount || quizCount === 0) && (!assignmentCount || assignmentCount === 0) ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-slate-500 text-sm">No content generated yet. Create your first quiz or assignment!</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
              <Link
                href="/instructor/quiz"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white gradient-bg px-4 py-2 rounded-lg"
              >
                <FileQuestion className="w-4 h-4" />
                Generate Quiz
              </Link>
              <Link
                href="/instructor/assignment"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-purple-600 px-4 py-2 rounded-lg"
              >
                <BookOpen className="w-4 h-4" />
                Generate Assignment
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Your recently generated content will appear here.</p>
        )}
      </div>
    </div>
  )
}
