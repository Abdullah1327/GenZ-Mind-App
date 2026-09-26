'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Page Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
      <p className="text-slate-500 text-sm mb-1">{error?.message || 'An unexpected error occurred.'}</p>
      {error?.digest && (
        <p className="text-slate-400 text-xs mb-6">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-semibold text-white gradient-bg rounded-xl"
        >
          Try Again
        </button>
        <Link
          href="/auth/signin"
          className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
