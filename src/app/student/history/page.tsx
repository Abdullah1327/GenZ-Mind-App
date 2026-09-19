'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  History,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  X,
  FileQuestion,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { QuizResult, Quiz, COURSES, CourseType } from '@/types'

export default function StudentHistoryPage() {
  const [results, setResults] = useState<QuizResult[]>([])
  const [quizzesMap, setQuizzesMap] = useState<Record<string, Quiz>>({})
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Fetch all results for student
        const { data: resData } = await supabase
          .from('quiz_results')
          .select('*')
          .eq('student_id', user.id)
          .order('completed_at', { ascending: false })

        const resList: QuizResult[] = resData || []
        setResults(resList)

        // Fetch corresponding quizzes
        const { data: qData } = await supabase.from('quizzes').select('*')
        const qMap: Record<string, Quiz> = {}
        if (qData) {
          qData.forEach((q: Quiz) => {
            qMap[q.id] = q
          })
        }
        setQuizzesMap(qMap)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalQuizzes = results.length
  const avgScore =
    totalQuizzes > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalQuizzes)
      : 0
  const bestScore =
    totalQuizzes > 0 ? Math.max(...results.map((r) => r.percentage || 0)) : 0
  const totalQuestionsAnswered = results.reduce(
    (sum, r) => sum + (r.total_questions || 0),
    0
  )

  const selectedQuiz = selectedResult ? quizzesMap[selectedResult.quiz_id] : null

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-7 h-7 text-indigo-600" />
            Quiz History & Performance
          </h1>
          <p className="text-slate-500 mt-1">
            Track your progress, review past test results, and analyze your growth.
          </p>
        </div>
        <Link
          href="/student/quiz"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white gradient-bg px-4 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-all self-start"
        >
          <Zap className="w-4 h-4" />
          Take New Quiz
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-medium">Quizzes Completed</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalQuizzes}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-medium">Average Score</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{avgScore}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-medium">Best Score</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{bestScore}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-500 font-medium">Total Questions Solved</p>
          <p className="text-2xl font-bold text-cyan-600 mt-1">{totalQuestionsAnswered}</p>
        </div>
      </div>

      {/* Quiz List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Past Quiz Attempts</h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading your quiz history...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">No quiz records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              You haven&apos;t completed any quizzes yet. Generate your first AI quiz to test your skills!
            </p>
            <Link
              href="/student/quiz"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white gradient-bg px-4 py-2 rounded-xl"
            >
              <Zap className="w-4 h-4" /> Start First Quiz
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((res) => {
              const quiz = quizzesMap[res.quiz_id]
              const courseKey = (quiz?.course as CourseType) || 'python'
              const courseInfo = COURSES[courseKey] || COURSES.python
              const isPassing = res.percentage >= 70

              return (
                <div
                  key={res.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {courseInfo.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {quiz?.topic || 'Curriculum Quiz'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{courseInfo.label}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(res.completed_at).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                          isPassing
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {res.score} / {res.total_questions} ({res.percentage}%)
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedResult(res)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Quiz Review — {selectedQuiz?.topic || 'Quiz Results'}
                </h3>
                <p className="text-xs text-slate-500">
                  Score: {selectedResult.score} / {selectedResult.total_questions} (
                  {selectedResult.percentage}%) • Completed on{' '}
                  {new Date(selectedResult.completed_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedResult.answers && selectedResult.answers.length > 0 ? (
                selectedResult.answers.map((ans, idx) => {
                  const q = selectedQuiz?.questions?.find((item) => item.id === ans.question_id)

                  return (
                    <div
                      key={ans.question_id || idx}
                      className={`p-4 rounded-xl border ${
                        ans.is_correct
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-red-200 bg-red-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-bold text-slate-900">
                          {idx + 1}. {q ? q.question : `Question ${idx + 1}`}
                        </p>
                        {ans.is_correct ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            <XCircle className="w-3 h-3" /> Incorrect
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="text-slate-600">
                          <span className="font-medium text-slate-400">Your choice:</span>{' '}
                          <span
                            className={
                              ans.is_correct
                                ? 'text-emerald-700 font-semibold'
                                : 'text-red-700 font-semibold'
                            }
                          >
                            {ans.selected_answer || '(None)'}
                          </span>
                        </p>
                        {q && !ans.is_correct && (
                          <p className="text-slate-600">
                            <span className="font-medium text-slate-400">Correct:</span>{' '}
                            <span className="text-emerald-700 font-semibold">
                              {q.correct_answer}
                            </span>
                          </p>
                        )}
                        {q?.explanation && (
                          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 mt-2">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">
                  Detailed question breakdown is not available for this record.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
