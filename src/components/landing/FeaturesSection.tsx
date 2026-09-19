import { Brain, FileQuestion, BookOpen, Zap } from 'lucide-react'

const features = [
  {
    icon: FileQuestion,
    title: 'AI Quiz Generator',
    description:
      'Generate intelligent quizzes based on course topics and difficulty levels. Practice at your own pace with instant feedback and detailed explanations.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    badge: 'For Students',
    badgeColor: 'bg-indigo-50 text-indigo-700',
  },
  {
    icon: Brain,
    title: 'AI Assignment Generator',
    description:
      'Help instructors create customized, structured assignments with objectives, deliverables, and grading rubrics — all powered by AI.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    badge: 'For Instructors',
    badgeColor: 'bg-purple-50 text-purple-700',
  },
  {
    icon: BookOpen,
    title: 'Document AI Assistant',
    description:
      'Upload your learning materials and ask questions directly from your documents. Our RAG-powered assistant answers only from your content.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
    badge: 'RAG Powered',
    badgeColor: 'bg-cyan-50 text-cyan-700',
  },
  {
    icon: Zap,
    title: 'Smart Learning',
    description:
      'Practice Python, Machine Learning, Deep Learning, and AI Automation through interactive AI-powered exercises tailored to your level.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    badge: 'Adaptive',
    badgeColor: 'bg-emerald-50 text-emerald-700',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            ✨ Platform Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Learn Smarter</span>
          </h2>
          <p className="text-slate-600 text-lg">
            A complete AI-powered toolkit for students to learn and instructors to teach effectively.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={`group relative bg-white rounded-2xl border ${feature.border} p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>

                {/* Badge */}
                <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${feature.badgeColor} mb-3`}>
                  {feature.badge}
                </span>

                {/* Content */}
                <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>

                {/* Hover gradient border effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ring-2 ring-indigo-200`} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
