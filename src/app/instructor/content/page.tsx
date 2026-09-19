'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  History,
  FileQuestion,
  BookOpen,
  Eye,
  Trash2,
  X,
  PlusCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  Share2,
  FileSpreadsheet,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Quiz, Assignment, COURSES, CourseType } from '@/types'
import { toast } from 'sonner'

export default function InstructorContentPage() {
  const [tab, setTab] = useState<'quizzes' | 'assignments'>('quizzes')
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  // Preview modals
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [editingFormQuiz, setEditingFormQuiz] = useState<Quiz | null>(null)
  const [formUrlInput, setFormUrlInput] = useState('')

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Fetch instructor quizzes
        const { data: qData } = await supabase
          .from('quizzes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // Fetch instructor assignments
        const { data: aData } = await supabase
          .from('assignments')
          .select('*')
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false })

        setQuizzes(qData || [])
        setAssignments(aData || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const supabase = createClient()
      await supabase.from('quizzes').eq('id', quizId).delete()
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId))
      toast.success('Quiz deleted from curriculum')
    } catch (e) {
      toast.error('Failed to delete quiz')
    }
  }

  const handleOpenFormModal = (quiz: Quiz) => {
    setEditingFormQuiz(quiz)
    setFormUrlInput(quiz.google_form_url || '')
  }

  const handleSaveGoogleFormUrl = async () => {
    if (!editingFormQuiz) return
    try {
      const supabase = createClient()
      await supabase.from('quizzes').upsert({
        id: editingFormQuiz.id,
        google_form_url: formUrlInput.trim() || null,
      })

      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === editingFormQuiz.id
            ? { ...q, google_form_url: formUrlInput.trim() || undefined }
            : q
        )
      )
      toast.success('Google Form link saved!')
      setEditingFormQuiz(null)
    } catch (e) {
      toast.error('Failed to update Google Form link')
    }
  }

  const handleDeleteAssignment = async (asgId: string) => {
    try {
      const supabase = createClient()
      await supabase.from('assignments').eq('id', asgId).delete()
      setAssignments((prev) => prev.filter((a) => a.id !== asgId))
      toast.success('Assignment deleted from curriculum')
    } catch (e) {
      toast.error('Failed to delete assignment')
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-7 h-7 text-purple-600" />
            Curriculum Content Management
          </h1>
          <p className="text-slate-500 mt-1">
            Browse, preview, and manage all your AI-generated quizzes and assignments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Link
            href="/instructor/quiz"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white gradient-bg px-4 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> New Quiz
          </Link>
          <Link
            href="/instructor/assignment"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> New Assignment
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab('quizzes')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'quizzes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          Quizzes ({quizzes.length})
        </button>

        <button
          onClick={() => setTab('assignments')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            tab === 'assignments'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Assignments ({assignments.length})
        </button>
      </div>

      {/* CONTENT LIST */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading published curriculum content...
        </div>
      ) : tab === 'quizzes' ? (
        quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">No quizzes created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Generate curriculum assessment quizzes with the AI quiz generator.
            </p>
            <Link
              href="/instructor/quiz"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white gradient-bg px-4 py-2 rounded-xl shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Create Assessment Quiz
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => {
              const courseInfo = COURSES[quiz.course as CourseType] || COURSES.python
              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{courseInfo.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {courseInfo.label}
                          </p>
                          <h3 className="text-base font-bold text-slate-900">{quiz.topic}</h3>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
                        {quiz.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-3 mb-4">
                      <span>{quiz.number_of_questions} Questions</span>
                      <span>•</span>
                      <span className="capitalize">{quiz.quiz_type}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedQuiz(quiz)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>

                      <button
                        onClick={() => handleOpenFormModal(quiz)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                          quiz.google_form_url
                            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Google Form & Share Link"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {quiz.google_form_url ? 'Google Form Linked' : 'Google Form / Share'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">No assignments created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Generate comprehensive assignments, project rubrics, and deliverables with AI.
          </p>
          <Link
            href="/instructor/assignment"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Create Assignment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((asg) => {
            const courseInfo = COURSES[asg.course as CourseType] || COURSES.machine_learning
            return (
              <div
                key={asg.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{courseInfo.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {courseInfo.label}
                        </p>
                        <h3 className="text-base font-bold text-slate-900">{asg.topic}</h3>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full capitalize">
                      {asg.student_level}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-3 mb-4">
                    <span className="capitalize">{asg.assignment_type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{asg.difficulty}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(asg.created_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedAssignment(asg)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Project Rubric
                  </button>

                  <button
                    onClick={() => handleDeleteAssignment(asg.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* QUIZ PREVIEW MODAL */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedQuiz.topic}</h3>
                <p className="text-xs text-slate-500 capitalize">
                  {selectedQuiz.course} • {selectedQuiz.difficulty} • {selectedQuiz.number_of_questions} Questions
                </p>
              </div>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedQuiz.questions.map((q, idx) => (
                <div key={q.id || idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <p className="text-sm font-bold text-slate-900">
                    {idx + 1}. {q.question}
                  </p>
                  {q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border ${
                            opt === q.correct_answer
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 pt-1">
                    <span className="font-bold text-slate-700">Explanation:</span> {q.explanation}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedQuiz(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT PREVIEW MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedAssignment.content?.title || selectedAssignment.topic}
                </h3>
                <p className="text-xs text-slate-500 capitalize">
                  {selectedAssignment.course} • {selectedAssignment.student_level} Level
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Objective</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedAssignment.content?.objective}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Scenario</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedAssignment.content?.scenario}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Deliverables</h4>
                <ul className="space-y-1 text-slate-600">
                  {selectedAssignment.content?.deliverables.map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> {d}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedAssignment.content?.evaluation_criteria && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Evaluation Rubric</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAssignment.content.evaluation_criteria.map((c, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg border border-slate-100 bg-purple-50/40 flex justify-between items-center"
                      >
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <span className="font-bold text-purple-700">{c.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE FORM & SHARE MODAL */}
      {editingFormQuiz && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Google Form & Student Share Link
                </h3>
                <p className="text-xs text-slate-500">
                  {editingFormQuiz.topic} ({editingFormQuiz.number_of_questions} Questions)
                </p>
              </div>
              <button
                onClick={() => setEditingFormQuiz(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Google Form Link */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  Google Form URL
                </label>
                <input
                  type="url"
                  value={formUrlInput}
                  onChange={(e) => setFormUrlInput(e.target.value)}
                  placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                />
                {formUrlInput && (
                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href={formUrlInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Linked Form
                    </a>
                  </div>
                )}
              </div>

              {/* Direct Link */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  Direct Student Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/student/quiz?quizId=${editingFormQuiz.id}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/student/quiz?quizId=${editingFormQuiz.id}`
                      navigator.clipboard.writeText(link)
                      toast.success('Direct student quiz link copied!')
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Share this link with your students. All responses submitted will be tracked on your Instructor Dashboard.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Link
                href="/instructor/dashboard#responses"
                onClick={() => setEditingFormQuiz(null)}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View Dashboard Responses →
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFormQuiz(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoogleFormUrl}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white gradient-bg shadow-sm hover:opacity-90"
                >
                  Save Google Form Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
