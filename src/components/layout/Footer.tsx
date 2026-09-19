import Link from 'next/link'
import { Brain, Globe, ExternalLink, MessageCircle } from 'lucide-react'

const footerLinks = {
  Platform: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Courses', href: '#courses' },
  ],
  Learn: [
    { label: 'Python', href: '#courses' },
    { label: 'Machine Learning', href: '#courses' },
    { label: 'Deep Learning', href: '#courses' },
    { label: 'AI Automation', href: '#courses' },
  ],
  Account: [
    { label: 'Sign Up', href: '/auth/signup' },
    { label: 'Sign In', href: '/auth/signin' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">GenZ Mind</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Learn Smarter. Build Your Future with AI. The modern learning platform designed for the next generation of AI professionals.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} GenZ Mind. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Powered by AI — Built for the Next Generation of Learners
          </p>
        </div>
      </div>
    </footer>
  )
}
