import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'GenZ Mind — Learn Smarter. Build Your Future with AI.',
  description:
    'GenZ Mind is an AI-powered learning platform for students and instructors. Master Python, Machine Learning, Deep Learning, and AI Automation with AI-generated quizzes and intelligent document-based learning.',
  keywords: ['AI learning', 'Python', 'Machine Learning', 'Deep Learning', 'AI Automation', 'quiz generator', 'GenZ Mind'],
  openGraph: {
    title: 'GenZ Mind — AI-Powered Learning Platform',
    description: 'Learn Smarter. Build Your Future with AI.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
