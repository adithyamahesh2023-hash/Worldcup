import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const session = await auth()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#fafafe] flex flex-col">
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">WC</span>
            <span className="text-xl font-bold text-primary">World Cup Predictor</span>
          </div>
          <Link href="/auth/signin" className="btn-primary text-sm">
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl text-center">
          <div className="w-20 h-20 bg-primary-bg rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              <circle cx="12" cy="14" r="2" strokeWidth={1.5} />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Predict World Cup 2026</h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Challenge friends and family. Predict every match score, climb the leaderboard, and claim bragging rights.
          </p>
          <Link href="/auth/signin" className="inline-flex items-center px-8 py-3 bg-primary text-white text-lg font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-sm">
            Get Started Free
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary-bg rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">🏆</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Simple Predictions</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Enter your score predictions before kickoff. Edit or change anytime until the match starts.</p>
            </div>
            <div className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary-bg rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Live Leaderboard</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Real-time rankings. Exact score earns 3 points, correct result earns 1 point.</p>
            </div>
            <div className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary-bg rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl">👥</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Private League</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Just your friends and family. Magic link sign-in, no passwords needed.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}