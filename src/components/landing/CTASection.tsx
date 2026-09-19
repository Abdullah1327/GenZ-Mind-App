import Link from 'next/link'
import { ArrowRight, Brain, Zap } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden gradient-bg rounded-3xl p-12 md:p-16 text-center shadow-2xl">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Brain className="w-9 h-9 text-white" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Ready to Learn Smarter?
            </h2>
            <p className="text-indigo-100 text-lg md:text-xl mb-8 max-w-xl mx-auto">
              Join GenZ Mind today and transform the way you learn and teach with the power of AI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                id="cta-get-started"
                className="inline-flex items-center gap-2 text-base font-bold text-indigo-700 bg-white px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all w-full sm:w-auto justify-center"
              >
                <Zap className="w-5 h-5" />
                Get Started Free
              </Link>
              <Link
                href="/auth/signin"
                id="cta-signin"
                className="inline-flex items-center gap-2 text-base font-semibold text-white border-2 border-white/40 px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all w-full sm:w-auto justify-center"
              >
                Already have an account?
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-indigo-200 text-sm mt-6">
              No credit card required · Free to get started · AI-powered from day one
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
