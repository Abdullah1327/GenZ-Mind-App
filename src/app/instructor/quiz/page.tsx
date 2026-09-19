'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileQuestion,
  Sparkles,
  Save,
  CheckCircle2,
  Copy,
  RotateCcw,
  Loader2,
  PlusCircle,
  Eye,
  ArrowRight,
  ExternalLink,
  Share2,
  FileSpreadsheet,
} from 'lucide-react'
import { COURSES, CourseType, DifficultyLevel, QuizType, QuizQuestion, Quiz } from '@/types'
import { COURSE_TOPICS, generateQuizQuestions } from '@/lib/curriculum'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function InstructorQuizPage() {
  const [course, setCourse] = useState<CourseType>('python')
  const [topic, setTopic] = useState(COURSE_TOPICS.python[0])
  const [customTopic, setCustomTopic] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate')
  const [quizType, setQuizType] = useState<QuizType>('mcq')
  const [numQuestions, setNumQuestions] = useState<number>(5)

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([])
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null)
  const [googleFormUrl, setGoogleFormUrl] = useState('')

  const effectiveTopic = customTopic.trim() ? customTopic.trim() : topic

  const handleGenerate = () => {
    setGenerating(true)
    setSavedQuizId(null)
    setTimeout(() => {
      const qList = generateQuizQuestions(
        course,
        effectiveTopic,
        difficulty,
        quizType,
        numQuestions
      )
      setGeneratedQuestions(qList)
      setGenerating(false)
      toast.success(`${qList.length} questions generated! Review and customize below.`)
    }, 600)
  }

  const handleUpdateQuestionText = (index: number, newText: string) => {
    setGeneratedQuestions((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], question: newText }
      return updated
    })
  }

  const handleSaveQuiz = async () => {
    if (generatedQuestions.length === 0) return

    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const quizId = `quiz-${Date.now()}`
      const quizData: Quiz = {
        id: quizId,
        user_id: user?.id || 'instructor-demo',
        course,
        topic: effectiveTopic,
        difficulty,
        quiz_type: quizType,
        number_of_questions: generatedQuestions.length,
        questions: generatedQuestions,
        google_form_url: googleFormUrl.trim() || undefined,
        created_at: new Date().toISOString(),
      }

      await supabase.from('quizzes').insert(quizData)
      setSavedQuizId(quizId)
      toast.success('Quiz published to curriculum successfully!')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to save quiz.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateGoogleFormUrl = async () => {
    if (!savedQuizId) return
    try {
      const supabase = createClient()
      await supabase.from('quizzes').upsert({
        id: savedQuizId,
        google_form_url: googleFormUrl.trim() || null,
      })
      toast.success('Google Form link saved to quiz!')
    } catch (e) {
      toast.error('Failed to update Google Form link')
    }
  }

  const handleCopyGoogleFormFormat = () => {
    const text = generatedQuestions
      .map((q, idx) => {
        const opts =
          q.options?.map((opt, i) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n') || ''
        return `Question ${idx + 1}: ${q.question}\n${opts}\nCorrect Answer: ${q.correct_answer}\nExplanation: ${q.explanation}`
      })
      .join('\n\n---\n\n')

    navigator.clipboard.writeText(text)
    toast.success('Questions formatted for Google Form copied to clipboard!')
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedQuestions, null, 2))
    toast.success('Quiz JSON copied to clipboard!')
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileQuestion className="w-7 h-7 text-indigo-600" />
            Instructor Quiz Generator
          </h1>
          <p className="text-slate-500 mt-1">
            Build, edit, and publish comprehensive assessment quizzes for your students.
          </p>
        </div>
        <Link
          href="/instructor/content"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-colors self-start"
        >
          <Eye className="w-4 h-4 text-slate-400" />
          View Published Content
        </Link>
      </div>

      {/* Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 mb-8">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Quiz Specifications
        </h2>

        {/* Course */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Course Track
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(COURSES).map(([key, c]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setCourse(key as CourseType)
                  setTopic(COURSE_TOPICS[key as CourseType][0])
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  course === key
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-100'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className="text-2xl mb-1">{c.icon}</div>
                <p className="font-bold text-xs text-slate-900 truncate">{c.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Topic Selection
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COURSE_TOPICS[course]?.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTopic(t)
                  setCustomTopic('')
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  topic === t && !customTopic
                    ? 'gradient-bg text-white shadow-sm font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Or write a customized topic (e.g. Convolutional Layer Kernels & Strides)..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </div>

        {/* Difficulty, Type, Count */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Target Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Format
            </label>
            <select
              value={quizType}
              onChange={(e) => setQuizType(e.target.value as QuizType)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none"
            >
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="true_false">True / False</option>
              <option value="mixed">Mixed Format</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Questions
            </label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
            </select>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white gradient-bg shadow-sm hover:opacity-95 transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Assessment...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Assessment Questions
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Questions List (Review & Edit) */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Assessment Preview ({generatedQuestions.length} Questions)</span>
              {savedQuizId && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Published
                </span>
              )}
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </button>

              <button
                type="button"
                onClick={handleSaveQuiz}
                disabled={saving || !!savedQuizId}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white gradient-bg shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...
                  </>
                ) : savedQuizId ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved in Curriculum
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Publish to Curriculum
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Google Form & Student Share Section */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                  Google Form & Student Share Link
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach your Google Form to make this quiz a shareable link for students. All responses appear directly on your Instructor Dashboard.
                </p>
              </div>
              <Link
                href="/instructor/dashboard#responses"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 flex-shrink-0 self-start"
              >
                View Dashboard Responses
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Google Form Link */}
              <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  Google Form URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={googleFormUrl}
                    onChange={(e) => setGoogleFormUrl(e.target.value)}
                    placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                  />
                  {savedQuizId && (
                    <button
                      type="button"
                      onClick={handleUpdateGoogleFormUrl}
                      className="px-3 py-2 rounded-lg text-xs font-bold text-white gradient-bg shadow-sm hover:opacity-90 flex-shrink-0"
                    >
                      Save Link
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {googleFormUrl && (
                    <a
                      href={googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Form
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyGoogleFormFormat}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy Questions for Google Form
                  </button>
                </div>
              </div>

              {/* Direct Quiz Share Link */}
              <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  Direct Student Link (Auto-Recorded)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      savedQuizId
                        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/student/quiz?quizId=${savedQuizId}`
                        : 'Publish quiz to generate direct link'
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    disabled={!savedQuizId}
                    onClick={() => {
                      const link = `${window.location.origin}/student/quiz?quizId=${savedQuizId}`
                      navigator.clipboard.writeText(link)
                      toast.success('Direct student quiz link copied to clipboard!')
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-40"
                    title="Copy direct quiz link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Share this link with students. When students complete the quiz, their scores and answers are instantly recorded to your Instructor Dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {generatedQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    Question #{idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-400 capitalize">{q.type}</span>
                </div>

                <textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) => handleUpdateQuestionText(idx, e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />

                {/* Options preview */}
                {q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = opt === q.correct_answer
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            isCorrect
                              ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-medium'
                              : 'border-slate-100 bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 uppercase">
                              Correct
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="pt-2 text-xs text-slate-500 flex items-start gap-1.5">
                  <span className="font-bold text-slate-700 flex-shrink-0">Explanation:</span>
                  <span>{q.explanation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
