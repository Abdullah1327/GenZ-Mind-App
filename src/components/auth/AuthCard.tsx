import Link from 'next/link'
import { Brain } from 'lucide-react'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  subtitle: string
  footer?: React.ReactNode
}

export default function AuthCard({ children, title, subtitle, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-md">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              GenZ <span className="gradient-text">Mind</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="text-center mt-6 text-sm text-slate-500">{footer}</div>
        )}
      </div>
    </div>
  )
}
