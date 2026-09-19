import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const courses = [
  {
    icon: '🐍',
    title: 'Python',
    subtitle: 'Programming Fundamentals',
    description:
      'Master programming fundamentals, OOP, data structures, file handling, APIs, and modern Python development.',
    topics: ['Basics & Syntax', 'OOP', 'Data Structures', 'Libraries', 'APIs'],
    gradient: 'from-yellow-400 to-green-500',
    bg: 'from-yellow-50 to-green-50',
    border: 'border-yellow-200',
    textColor: 'text-yellow-700',
  },
  {
    icon: '🤖',
    title: 'Machine Learning',
    subtitle: 'Classical ML Algorithms',
    description:
      'Regression, classification, decision trees, Random Forest, XGBoost, feature engineering, and model evaluation.',
    topics: ['Regression', 'Classification', 'Random Forest', 'XGBoost', 'Model Evaluation'],
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    icon: '🧠',
    title: 'Deep Learning',
    subtitle: 'Neural Networks & AI',
    description:
      'Neural networks, CNNs for computer vision, RNNs, LSTMs, Transformers, BERT, and modern architectures.',
    topics: ['Neural Networks', 'CNNs', 'RNNs', 'Transformers', 'BERT'],
    gradient: 'from-purple-500 to-pink-600',
    bg: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    textColor: 'text-purple-700',
  },
  {
    icon: '⚡',
    title: 'AI Automation & Data Analysis',
    subtitle: 'Agents, Workflows & Analytics',
    description:
      'AI agents, n8n workflows, automation tools, chatbots, data analysis with Pandas, visualization, and more.',
    topics: ['AI Agents', 'n8n Workflows', 'Pandas', 'Data Visualization', 'Chatbots'],
    gradient: 'from-cyan-500 to-blue-600',
    bg: 'from-cyan-50 to-blue-50',
    border: 'border-cyan-200',
    textColor: 'text-cyan-700',
  },
]

export default function CourseTopicsSection() {
  return (
    <section id="courses" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            📚 Learning Tracks
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Explore Our{' '}
            <span className="gradient-text">Course Topics</span>
          </h2>
          <p className="text-slate-600 text-lg">
            Structured learning tracks from beginner to advanced — powered by AI at every step.
          </p>
        </div>

        {/* Course Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course.title}
              className={`group relative bg-gradient-to-br ${course.bg} rounded-2xl border ${course.border} p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
            >
              {/* Background decoration */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${course.gradient} opacity-10 rounded-bl-[80px]`} />

              {/* Icon */}
              <div className="text-4xl mb-4">{course.icon}</div>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-900 mb-0.5">{course.title}</h3>
              <p className={`text-xs font-semibold ${course.textColor} mb-3`}>{course.subtitle}</p>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{course.description}</p>

              {/* Topic Tags */}
              <div className="flex flex-wrap gap-1.5">
                {course.topics.map((topic) => (
                  <span
                    key={topic}
                    className={`text-[11px] font-medium ${course.textColor} bg-white/70 border border-white px-2 py-0.5 rounded-full backdrop-blur-sm`}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 text-base font-semibold text-white gradient-bg px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all"
          >
            Start Learning for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
