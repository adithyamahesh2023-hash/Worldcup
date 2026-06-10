'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('nodemailer', {
      email,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      setError(`Failed to send email: ${result.error}`)
    } else {
      router.push(`/auth/verify-request?email=${encodeURIComponent(email)}`)
    }
    setLoading(false)
  }

  return (
    <div className="card p-10 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-primary-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-1 text-sm">Enter your email to receive a magic link</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        No password needed. Check your inbox for the sign-in link.
      </p>
    </div>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#fafafe] flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="card p-10 w-full max-w-md text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }>
        <SignInForm />
      </Suspense>
    </div>
  )
}