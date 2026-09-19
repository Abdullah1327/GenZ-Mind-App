'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, GraduationCap } from 'lucide-react'
import AuthCard from '@/components/auth/AuthCard'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email'
    if (!form.password) newErrors.password = 'Password is required'
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
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
      // Students only — role is always 'student'
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: 'student',
          },
        },
      })

      if (error) throw error

      if (data.user) {
        toast.success('Account created successfully! Welcome to GenZ Mind 🎉')
        router.push('/student/dashboard')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join GenZ Mind and start learning smarter with AI"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-semibold text-indigo-600 hover:underline">
            Sign In
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* Student badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
          <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-700">Student Account</p>
            <p className="text-xs text-indigo-500">Learn with AI-powered quizzes &amp; documents</p>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={form.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
              errors.fullName
                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white'
            }`}
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
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

        {/* Confirm Password */}
        <div>
          <label htmlFor="signup-confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="signup-confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
                errors.confirmPassword
                  ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                  : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="signup-submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-bg py-3 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Creating Account...' : 'Create Student Account'}
        </button>

        <p className="text-xs text-center text-slate-400">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthCard>
  )
}
