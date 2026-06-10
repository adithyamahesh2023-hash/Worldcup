'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Unknown error'

  const messages: Record<string, string> = {
    Configuration: 'Server configuration error.',
    AccessDenied: 'You may not have permission.',
    Verification: 'The sign-in link is invalid or has expired.',
    Default: 'An error occurred during sign in.',
  }

  const message = messages[error] || messages.Default

  return (
    <div className="card p-10 w-full max-w-md text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
      <p className="text-gray-500 mb-8">{message}</p>
      <a href="/auth/signin" className="btn-primary">
        Try Again
      </a>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#fafafe] flex items-center justify-center px-4">
      <Suspense fallback={<div className="card p-10 w-full max-w-md text-center"><p className="text-gray-400">Loading...</p></div>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  )
}