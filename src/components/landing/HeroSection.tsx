import Link from 'next/link'
import { ArrowRight, Zap, Sparkles, BookOpen, Brain } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden gradient-soft pt-16">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-50 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text Content */}
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              Learn Smarter.{' '}
              <span className="gradient-text">Build Your Future</span>{' '}
              with AI.
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
              GenZ Mind helps students learn{' '}
              <span className="font-semibold text-slate-800">Python, Machine Learning, Deep Learning,</span>{' '}
              and{' '}
              <span className="font-semibold text-slate-800">AI Automation</span>{' '}
              through AI-powered quizzes and intelligent document-based learning.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href="/auth/signup"
                id="hero-get-started"
                className="inline-flex items-center gap-2 text-base font-semibold text-white gradient-bg px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all"
              >
                <Zap className="w-5 h-5" />
                Get Started Free
              </Link>
              <a
                href="#features"
                id="hero-explore"
                className="inline-flex items-center gap-2 text-base font-semibold text-indigo-600 bg-white border border-indigo-200 px-6 py-3 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
              >
                Explore Platform
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center gap-6">
              {[
                { icon: '🐍', label: 'Python' },
                { icon: '🤖', label: 'ML' },
                { icon: '🧠', label: 'Deep Learning' },
                { icon: '⚡', label: 'AI Automation' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-sm text-slate-600">
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Visual */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md animate-float">
              {/* Main card */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">AI Quiz Generator</p>
                    <p className="text-xs text-slate-500">Generating quiz...</p>
                  </div>
                </div>

                {/* Fake quiz preview */}
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs font-medium text-slate-700 mb-2">
                      What is overfitting in Machine Learning?
                    </p>
                    <div className="space-y-1.5">
                      {['When a model trains too fast', 'When a model learns noise from training data', 'When data has missing values', 'When features are not scaled'].map(
                        (opt, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-2 p-2 rounded-md text-xs transition-colors ${
                              i === 1
                                ? 'bg-green-100 text-green-800 font-medium'
                                : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Question 3 of 10</span>
                    <span className="font-medium text-indigo-600">30%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[30%] gradient-bg rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating badge — score */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-xs text-slate-500">Score</p>
                    <p className="text-sm font-bold text-slate-900">8 / 10</p>
                  </div>
                </div>
              </div>

              {/* Floating badge — document */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="text-xs text-slate-500">RAG Document</p>
                    <p className="text-sm font-bold text-slate-900">Uploaded ✓</p>
                  </div>
                </div>
              </div>

              {/* Floating icon — document assistant */}
              <div className="absolute top-1/2 -left-8 -translate-y-1/2 bg-indigo-600 rounded-xl shadow-lg p-2.5">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
