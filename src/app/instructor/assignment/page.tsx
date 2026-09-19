'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Sparkles,
  Save,
  CheckCircle2,
  Copy,
  RotateCcw,
  Loader2,
  FileCheck,
  Award,
  Layers,
  Eye,
  Download,
} from 'lucide-react'
import { COURSES, CourseType, DifficultyLevel, AssignmentType, Assignment, AssignmentContent } from '@/types'
import { COURSE_TOPICS, generateAssignmentContent } from '@/lib/curriculum'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function InstructorAssignmentPage() {
  const [course, setCourse] = useState<CourseType>('machine_learning')
  const [topic, setTopic] = useState(COURSE_TOPICS.machine_learning[0])
  const [customTopic, setCustomTopic] = useState('')
  const [studentLevel, setStudentLevel] = useState<DifficultyLevel>('intermediate')
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('practical')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedAssignment, setGeneratedAssignment] = useState<AssignmentContent | null>(null)
  const [savedAssignmentId, setSavedAssignmentId] = useState<string | null>(null)

  const effectiveTopic = customTopic.trim() ? customTopic.trim() : topic

  const handleGenerate = () => {
    setGenerating(true)
    setSavedAssignmentId(null)
    setTimeout(() => {
      const content = generateAssignmentContent(course, effectiveTopic, studentLevel, assignmentType)
      setGeneratedAssignment(content)
      setGenerating(false)
      toast.success('Structured assignment generated with rubric!')
    }, 600)
  }

  const handleSaveAssignment = async () => {
    if (!generatedAssignment) return

    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const assignmentId = `asg-${Date.now()}`
      const newAssignment: Assignment = {
        id: assignmentId,
        instructor_id: user?.id || 'instructor-demo',
        course,
        topic: effectiveTopic,
        student_level: studentLevel,
        assignment_type: assignmentType,
        difficulty,
        content: generatedAssignment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await supabase.from('assignments').insert(newAssignment)
      setSavedAssignmentId(assignmentId)
      toast.success('Assignment saved to course curriculum!')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to save assignment.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyMarkdown = () => {
    if (!generatedAssignment) return
    const md = `# ${generatedAssignment.title}

## Objective
${generatedAssignment.objective}

## Scenario
${generatedAssignment.scenario}

## Task Requirements
${generatedAssignment.task_requirements.map((r) => `- ${r}`).join('\n')}

## Instructions
${generatedAssignment.instructions}

## Deliverables
${generatedAssignment.deliverables.map((d) => `- ${d}`).join('\n')}

## Evaluation Rubric
${generatedAssignment.evaluation_criteria.map((c) => `- ${c.name}: ${c.percentage}%`).join('\n')}
`
    navigator.clipboard.writeText(md)
    toast.success('Assignment Markdown copied to clipboard!')
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-purple-600" />
            AI Assignment Generator
          </h1>
          <p className="text-slate-500 mt-1">
            Create high-impact learning projects, case studies, and rubrics for your students.
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

      {/* Configuration */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 mb-8">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Assignment Parameters
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
                    ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-100'
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
                    ? 'bg-purple-600 text-white shadow-sm font-semibold'
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
            placeholder="Or write a customized topic (e.g. End-to-End Customer Churn Classifier with XGBoost)..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
          />
        </div>

        {/* Level, Type, Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Student Level
            </label>
            <select
              value={studentLevel}
              onChange={(e) => setStudentLevel(e.target.value as DifficultyLevel)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Assignment Type
            </label>
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none"
            >
              <option value="practical">Practical Application</option>
              <option value="coding">Coding Challenge</option>
              <option value="project_based">Project-Based</option>
              <option value="research">Research & Analysis</option>
              <option value="theory">Theoretical Framework</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Scope / Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none"
            >
              <option value="easy">Easy (1-2 Hours)</option>
              <option value="medium">Medium (3-5 Hours)</option>
              <option value="hard">Hard (Full Mini-Project)</option>
            </select>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Curriculum Project...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Project & Rubric
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Assignment Card */}
      {generatedAssignment && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {assignmentType.replace('_', ' ')} • {studentLevel}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{generatedAssignment.title}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Markdown
              </button>

              <button
                type="button"
                onClick={handleSaveAssignment}
                disabled={saving || !!savedAssignmentId}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...
                  </>
                ) : savedAssignmentId ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved in Curriculum
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Publish Assignment
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Objective */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-purple-600" /> Learning Objective
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {generatedAssignment.objective}
            </p>
          </div>

          {/* Scenario */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" /> Scenario & Problem Statement
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {generatedAssignment.scenario}
            </p>
          </div>

          {/* Requirements & Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Task Requirements</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {generatedAssignment.task_requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 bg-purple-50/40 p-2.5 rounded-lg border border-purple-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Student Deliverables</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {generatedAssignment.deliverables.map((deliv, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{deliv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Submission Instructions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{generatedAssignment.instructions}</p>
          </div>

          {/* Rubric */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-600" /> Grading Rubric & Evaluation Criteria
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {generatedAssignment.evaluation_criteria.map((crit, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-800">{crit.name}</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                    {crit.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
