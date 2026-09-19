'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Brain,
  LayoutDashboard,
  FileQuestion,
  BookOpen,
  History,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

interface DashboardSidebarProps {
  role: 'student' | 'instructor'
  userName?: string
  userEmail?: string
}

const studentNav: NavItem[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/quiz', label: 'AI Quiz Generator', icon: FileQuestion },
  { href: '/student/documents', label: 'Document Assistant', icon: BookOpen },
  { href: '/student/history', label: 'Quiz History', icon: History },
  { href: '/student/profile', label: 'Profile', icon: User },
]

const instructorNav: NavItem[] = [
  { href: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instructor/quiz', label: 'AI Quiz Generator', icon: FileQuestion },
  { href: '/instructor/assignment', label: 'Assignment Generator', icon: BookOpen },
  { href: '/instructor/content', label: 'Generated Content', icon: History },
  { href: '/instructor/profile', label: 'Profile', icon: User },
]

export default function DashboardSidebar({ role, userName, userEmail }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = role === 'student' ? studentNav : instructorNav
  const accentColor = role === 'student' ? 'indigo' : 'purple'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-sm">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900">
            GenZ <span className="gradient-text">Mind</span>
          </span>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{userName || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail || ''}</p>
          </div>
        </div>
        <div className="mt-2">
          <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${role === 'student' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
            }`}>
            {role === 'student' ? '🎓 Student' : '👨‍🏫 Instructor'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? `gradient-bg text-white shadow-sm`
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
              {item.label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-white/70" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          id="sidebar-logout"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 flex-shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-slate-100 shadow-sm flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-base">GenZ <span className="gradient-text">Mind</span></span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-14 left-0 bottom-0 z-40 w-72 bg-white shadow-xl transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
