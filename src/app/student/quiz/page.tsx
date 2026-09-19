'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Brain,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Sparkles,
  Loader2,
  BookOpen,
} from 'lucide-react'
import { COURSES, CourseType, DifficultyLevel, QuizType, QuizQuestion, Quiz } from '@/types'
import { COURSE_TOPICS, generateQuizQuestions } from '@/lib/curriculum'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function StudentQuizPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialCourse = (searchParams.get('course') as CourseType) || 'python'
  const [course, setCourse] = useState<CourseType>(initialCourse)
  const [topic, setTopic] = useState(COURSE_TOPICS[initialCourse]?.[0] || 'Python Basics')
  const [customTopic, setCustomTopic] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner')
  const [quizType, setQuizType] = useState<QuizType>('mcq')
  const [numQuestions, setNumQuestions] = useState<number>(5)

  // State machine: 'config' | 'taking' | 'result'
  const [quizState, setQuizState] = useState<'config' | 'taking' | 'result'>('config')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [finalScore, setFinalScore] = useState<{ score: number; total: number; percentage: number } | null>(null)

  const quizIdParam = searchParams.get('quizId')

  // Update topic options when course changes
  useEffect(() => {
    const topics = COURSE_TOPICS[course]
    if (topics && topics.length > 0) {
      setTopic(topics[0])
    }
  }, [course])

  // Load specific quiz if shared via direct link
  useEffect(() => {
    if (quizIdParam) {
      loadSpecificQuiz(quizIdParam)
    }
  }, [quizIdParam])

  const loadSpecificQuiz = async (id: string) => {
    try {
      setIsGenerating(true)
      const supabase = createClient()
      const { data } = await supabase.from('quizzes').select('*').eq('id', id).single()
      if (data && data.questions) {
        setCurrentQuiz(data)
        setCourse(data.course)
        setTopic(data.topic)
        setDifficulty(data.difficulty)
        setQuizType(data.quiz_type)
        setCurrentIndex(0)
        setUserAnswers({})
        setQuizState('taking')
        toast.success(`Loaded assigned quiz: "${data.topic}"`)
      }
    } catch (e) {
      console.error('Failed to load quiz', e)
    } finally {
      setIsGenerating(false)
    }
  }

  const effectiveTopic = customTopic.trim() ? customTopic.trim() : topic

  const handleGenerateQuiz = async () => {
    setIsGenerating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Generate question items
      const questions = generateQuizQuestions(
        course,
        effectiveTopic,
        difficulty,
        quizType,
        numQuestions
      )

      const quizData: Quiz = {
        id: `quiz-${Date.now()}`,
        user_id: user?.id || 'demo-student',
        course,
        topic: effectiveTopic,
        difficulty,
        quiz_type: quizType,
        number_of_questions: questions.length,
        questions,
        created_at: new Date().toISOString(),
      }

      // Save to database
      await supabase.from('quizzes').insert(quizData)

      setCurrentQuiz(quizData)
      setCurrentIndex(0)
      setUserAnswers({})
      setQuizState('taking')
      toast.success('Quiz generated successfully! Good luck!')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to generate quiz. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmitQuiz = async () => {
    if (!currentQuiz) return

    let correctCount = 0
    const answerRecords = currentQuiz.questions.map((q) => {
      const selected = userAnswers[q.id] || ''
      const isCorrect = selected.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
      if (isCorrect) correctCount++
      return {
        question_id: q.id,
        selected_answer: selected,
        is_correct: isCorrect,
      }
    })

    const total = currentQuiz.questions.length
    const percentage = Math.round((correctCount / total) * 100)
    setFinalScore({ score: correctCount, total, percentage })
    setQuizState('result')

    // Save result in DB
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from('quiz_results').insert({
          id: `res-${Date.now()}`,
          quiz_id: currentQuiz.id,
          student_id: user.id,
          score: correctCount,
          total_questions: total,
          percentage,
          answers: answerRecords,
          completed_at: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.error('Failed to save quiz result', e)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-7 h-7 text-indigo-600" />
            AI Quiz Generator
          </h1>
          <p className="text-slate-500 mt-1">
            Generate custom AI quizzes tailored to your course and skill level.
          </p>
        </div>
        {quizState !== 'config' && (
          <button
            onClick={() => setQuizState('config')}
            className="self-start inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            New Quiz
          </button>
        )}
      </div>

      {/* VIEW: CONFIGURATION */}
      {quizState === 'config' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Step 1: Select Course */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-3">
              1. Choose Learning Track
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(COURSES).map(([key, c]) => {
                const isSelected = course === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCourse(key as CourseType)}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-200'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-2">{c.icon}</div>
                    <p className="font-bold text-slate-900 text-sm">{c.label}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Topic Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-3">
              2. Select or Enter Topic
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COURSE_TOPICS[course]?.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTopic(t)
                    setCustomTopic('')
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    topic === t && !customTopic
                      ? 'gradient-bg text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              placeholder="Or type a custom topic (e.g. Asynchronous Python, LSTMs, Prompt Tuning)..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          {/* Step 3: Difficulty & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 text-xs font-semibold capitalize rounded-lg border transition-all ${
                      difficulty === d
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Quiz Type */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Question Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'mcq', label: 'MCQ' },
                    { id: 'true_false', label: 'True/False' },
                    { id: 'mixed', label: 'Mixed' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setQuizType(t.id)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      quizType === t.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Number of Questions</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumQuestions(num)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      numQuestions === num
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleGenerateQuiz}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white gradient-bg shadow-md hover:shadow-lg hover:opacity-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate AI Quiz
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW: TAKING QUIZ */}
      {quizState === 'taking' && currentQuiz && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{COURSES[currentQuiz.course].icon}</span>
              <div>
                <p className="font-bold text-slate-900 text-sm">{currentQuiz.topic}</p>
                <p className="text-xs text-slate-500 capitalize">{currentQuiz.difficulty} Level</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-indigo-600">
                Question {currentIndex + 1} of {currentQuiz.questions.length}
              </span>
              <div className="w-36 h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full gradient-bg transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / currentQuiz.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Google Form Link banner if available */}
          {currentQuiz.google_form_url && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-xs font-bold text-purple-900">Google Form Available for this Quiz</p>
                  <p className="text-[11px] text-purple-700">Your instructor provided a Google Form for this quiz. You can submit here or directly on Google Forms.</p>
                </div>
              </div>
              <a
                href={currentQuiz.google_form_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-colors flex-shrink-0"
              >
                Open Google Form ↗
              </a>
            </div>
          )}

          {/* Question Card */}
          {(() => {
            const q = currentQuiz.questions[currentIndex]
            const selected = userAnswers[q.id]

            return (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-6">
                  {currentIndex + 1}. {q.question}
                </h2>

                {/* Options */}
                {q.options && q.options.length > 0 ? (
                  <div className="space-y-3 mb-8">
                    {q.options.map((opt, idx) => {
                      const isOptionSelected = selected === opt
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectAnswer(q.id, opt)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                            isOptionSelected
                              ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-slate-900 shadow-sm'
                              : 'border-slate-100 hover:border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span className="text-sm">{opt}</span>
                          <span
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isOptionSelected
                                ? 'border-indigo-600 bg-indigo-600'
                                : 'border-slate-300'
                            }`}
                          >
                            {isOptionSelected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mb-8">
                    <textarea
                      rows={3}
                      value={selected || ''}
                      onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full p-4 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                )}

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => i - 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {currentIndex < currentQuiz.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((i) => i + 1)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-bg shadow-sm hover:opacity-90 transition-all"
                    >
                      Next Question
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitQuiz}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      Submit Quiz
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* VIEW: RESULT */}
      {quizState === 'result' && currentQuiz && finalScore && (
        <div className="space-y-8 animate-fade-in">
          {/* Score Header Banner */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center relative overflow-hidden">
            <div className="w-20 h-20 rounded-full gradient-bg text-white flex items-center justify-center mx-auto mb-4 shadow-md">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {finalScore.percentage >= 80
                ? 'Outstanding Achievement! 🎉'
                : finalScore.percentage >= 50
                ? 'Great Job! Keep Growing! 👍'
                : 'Nice Try! Practice Makes Perfect! 💪'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              You scored <span className="font-bold text-slate-900">{finalScore.score}</span> out of{' '}
              <span className="font-bold text-slate-900">{finalScore.total}</span> questions (
              <span className="font-bold text-indigo-600">{finalScore.percentage}%</span>)
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={() => {
                  setUserAnswers({})
                  setCurrentIndex(0)
                  setQuizState('taking')
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Quiz
              </button>
              <button
                onClick={() => setQuizState('config')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-bg shadow-sm hover:opacity-90 transition-all"
              >
                <Zap className="w-4 h-4" />
                New Quiz
              </button>
              <Link
                href="/student/history"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                View Quiz History
              </Link>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Question Review & Explanations</h3>
            {currentQuiz.questions.map((q, idx) => {
              const selected = userAnswers[q.id] || '(No Answer)'
              const isCorrect =
                selected.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()

              return (
                <div
                  key={q.id}
                  className={`p-6 rounded-2xl border bg-white shadow-sm transition-all ${
                    isCorrect ? 'border-emerald-100' : 'border-red-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="font-bold text-slate-900 text-base">
                      {idx + 1}. {q.question}
                    </h4>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full flex-shrink-0">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="text-sm space-y-1.5 mb-3">
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-400">Your Answer:</span>{' '}
                      <span
                        className={
                          isCorrect ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'
                        }
                      >
                        {selected}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-400">Correct Answer:</span>{' '}
                        <span className="text-emerald-700 font-semibold">{q.correct_answer}</span>
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Explanation: </span>
                      {q.explanation}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
