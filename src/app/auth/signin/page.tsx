'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import AuthCard from '@/components/auth/AuthCard'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const router = useRouter()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email'
    if (!form.password) newErrors.password = 'Password is required'
    return newErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (error) throw error

      if (data.user) {
        // Role is returned directly in the session user object
        const role = (data.user as any).role || 'student'
        toast.success('Welcome back! 👋')

        if (role === 'instructor') {
          router.push('/instructor/dashboard')
        } else {
          router.push('/student/dashboard')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your GenZ Mind account"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-semibold text-indigo-600 hover:underline">
            Sign Up Free
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="signin-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
              errors.email
                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white'
            }`}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="signin-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="signin-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
                errors.password
                  ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                  : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="signin-submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-bg py-3 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Info box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <p className="text-xs text-slate-500 text-center font-medium">
            🎓 Students — <Link href="/auth/signup" className="text-indigo-600 underline">create a free account</Link> to get started
          </p>
          <p className="text-xs text-slate-400 text-center">
            👨‍🏫 Instructors use their designated credentials to sign in
          </p>
        </div>
      </form>
    </AuthCard>
  )
}
