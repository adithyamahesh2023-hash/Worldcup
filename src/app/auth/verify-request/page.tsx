'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function VerifyRequestContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'

  return (
    <div className="card p-10 w-full max-w-md text-center">
      <div className="w-16 h-16 bg-primary-bg rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
      <p className="text-gray-500 mb-1">We&apos;ve sent a magic link to</p>
      <p className="font-medium text-primary mb-6">{email}</p>
      <p className="text-sm text-gray-400 mb-6">Click the link in the email to sign in. It expires in 24 hours.</p>
      <p className="text-sm text-gray-400">
        Didn&apos;t receive it? Check your spam folder or{' '}
        <a href="/auth/signin" className="text-primary hover:text-primary-dark underline">request another</a>.
      </p>
    </div>
  )
}

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-[#fafafe] flex items-center justify-center px-4">
      <Suspense fallback={<div className="card p-10 w-full max-w-md text-center"><p className="text-gray-400">Loading...</p></div>}>
        <VerifyRequestContent />
      </Suspense>
    </div>
  )
}