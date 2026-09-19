'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, GraduationCap, BookOpen } from 'lucide-react'
import AuthCard from '@/components/auth/AuthCard'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

export default function SignUpPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
  })
  const [showPassword, setShowPassword] = useState(false)
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
    if (!form.role) newErrors.role = 'Please select your role'
    return newErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleRoleSelect = (role: UserRole) => {
    setForm((prev) => ({ ...prev, role }))
    if (errors.role) setErrors((prev) => ({ ...prev, role: '' }))
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
      // 1. Create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: form.role,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // 2. Upsert profile (trigger may have already created one)
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: form.fullName,
          email: form.email,
          role: form.role,
          updated_at: new Date().toISOString(),
        })

        toast.success('Account created successfully! Welcome to GenZ Mind 🎉')

        // 3. Redirect based on role
        if (form.role === 'instructor') {
          router.push('/instructor/dashboard')
        } else {
          router.push('/student/dashboard')
        }
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
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
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
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
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
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
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
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
              errors.confirmPassword
                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white'
            }`}
          />
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">I am a...</label>
          <div className="grid grid-cols-2 gap-3">
            {/* Student */}
            <button
              type="button"
              id="role-student"
              onClick={() => handleRoleSelect('student')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.role === 'student'
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.role === 'student' ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                <GraduationCap className={`w-5 h-5 ${form.role === 'student' ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <span className={`text-sm font-semibold ${form.role === 'student' ? 'text-indigo-700' : 'text-slate-600'}`}>
                Student
              </span>
              <span className="text-[11px] text-slate-400 text-center">Learn with AI quizzes & docs</span>
            </button>

            {/* Instructor */}
            <button
              type="button"
              id="role-instructor"
              onClick={() => handleRoleSelect('instructor')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.role === 'instructor'
                  ? 'border-purple-500 bg-purple-50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.role === 'instructor' ? 'bg-purple-500' : 'bg-slate-200'}`}>
                <BookOpen className={`w-5 h-5 ${form.role === 'instructor' ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <span className={`text-sm font-semibold ${form.role === 'instructor' ? 'text-purple-700' : 'text-slate-600'}`}>
                Instructor
              </span>
              <span className="text-[11px] text-slate-400 text-center">Create quizzes & assignments</span>
            </button>
          </div>
          {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="signup-submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-bg py-3 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-xs text-center text-slate-400">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthCard>
  )
}
