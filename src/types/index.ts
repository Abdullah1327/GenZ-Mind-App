// Supabase types and database schema types

export type UserRole = 'student' | 'instructor'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  user_id: string
  course: CourseType
  topic: string
  difficulty: DifficultyLevel
  quiz_type: QuizType
  number_of_questions: number
  questions: QuizQuestion[]
  google_form_url?: string
  created_at: string
}

export interface QuizQuestion {
  id: string
  question: string
  options?: string[]
  correct_answer: string
  explanation: string
  type: 'mcq' | 'true_false' | 'short_answer'
}

export interface QuizResult {
  id: string
  quiz_id: string
  student_id: string
  score: number
  total_questions: number
  percentage: number
  answers: StudentAnswer[]
  completed_at: string
}

export interface StudentAnswer {
  question_id: string
  selected_answer: string
  is_correct: boolean
}

export interface Assignment {
  id: string
  instructor_id: string
  course: CourseType
  topic: string
  student_level: DifficultyLevel
  assignment_type: AssignmentType
  difficulty: 'easy' | 'medium' | 'hard'
  content: AssignmentContent
  created_at: string
  updated_at: string
}

export interface AssignmentContent {
  title: string
  objective: string
  scenario: string
  task_requirements: string[]
  instructions: string
  deliverables: string[]
  evaluation_criteria: EvaluationCriteria[]
}

export interface EvaluationCriteria {
  name: string
  percentage: number
}

export interface Document {
  id: string
  user_id: string
  file_name: string
  file_type: string
  file_path: string
  content?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: DocumentSource[]
  created_at: string
}

export interface DocumentSource {
  file_name: string
  page_number?: number
  chunk_index: number
}

// Enums
export type CourseType = 'python' | 'machine_learning' | 'deep_learning' | 'ai_automation'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export type QuizType = 'mcq' | 'true_false' | 'short_answer' | 'mixed'

export type AssignmentType = 'theory' | 'practical' | 'coding' | 'research' | 'project_based' | 'mixed'

// Course display info
export const COURSES: Record<CourseType, { label: string; icon: string; description: string; color: string }> = {
  python: {
    label: 'Python',
    icon: '🐍',
    description: 'Programming fundamentals, OOP, data structures, and more.',
    color: 'from-yellow-400 to-green-500',
  },
  machine_learning: {
    label: 'Machine Learning',
    icon: '🤖',
    description: 'Regression, classification, decision trees, Random Forest, XGBoost, and more.',
    color: 'from-blue-500 to-indigo-600',
  },
  deep_learning: {
    label: 'Deep Learning',
    icon: '🧠',
    description: 'Neural networks, CNNs, RNNs, Transformers, and more.',
    color: 'from-purple-500 to-pink-600',
  },
  ai_automation: {
    label: 'AI Automation & Data Analysis',
    icon: '⚡',
    description: 'AI agents, workflows, automation tools, chatbots, data analysis, and more.',
    color: 'from-cyan-500 to-blue-600',
  },
}
