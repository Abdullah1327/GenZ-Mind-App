import { UserPlus, Settings, Layers, Trophy } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create an Account',
    description: 'Sign up as a Student or Instructor in seconds. No credit card required.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    step: '02',
    icon: Settings,
    title: 'Select Your Role',
    description: 'Choose between Student or Instructor to get a personalized dashboard experience.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    step: '03',
    icon: Layers,
    title: 'Choose a Learning Tool',
    description: 'Pick from AI Quiz Generator, Document Assistant, or Assignment Generator.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    step: '04',
    icon: Trophy,
    title: 'Learn and Practice with AI',
    description: 'Take quizzes, chat with documents, and track your progress as you grow.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            🚀 Simple Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            How <span className="gradient-text">GenZ Mind</span> Works
          </h2>
          <p className="text-slate-600 text-lg">
            Get started in minutes with our simple, intuitive onboarding process.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-emerald-200" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="relative flex flex-col items-center text-center">
                  {/* Step number + icon */}
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 ${step.bg} rounded-2xl flex items-center justify-center shadow-sm border-2 border-white relative z-10`}>
                      <Icon className={`w-7 h-7 ${step.color}`} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 gradient-bg rounded-full flex items-center justify-center z-20 shadow-sm">
                      <span className="text-[10px] font-bold text-white">{step.step.replace('0', '')}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
