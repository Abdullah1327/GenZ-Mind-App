'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>
            {error?.message || 'An unexpected error occurred.'}
          </p>
          {error?.digest && (
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
