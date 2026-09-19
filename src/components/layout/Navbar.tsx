'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Brain, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#courses', label: 'Courses' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">
              GenZ <span className="gradient-text">Mind</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white gradient-bg px-4 py-2 rounded-lg shadow-sm hover:shadow-md hover:opacity-90 transition-all"
            >
              <Zap className="w-4 h-4" />
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-lg animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/auth/signin"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white gradient-bg px-4 py-2.5 rounded-lg"
              >
                <Zap className="w-4 h-4" />
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
