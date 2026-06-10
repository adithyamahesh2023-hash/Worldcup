import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  const users = await prisma.user.findMany({
    include: { predictions: true },
  })

  const ranked = users
    .map((user) => {
      const totalPoints = user.predictions.reduce((sum, p) => sum + p.points, 0)
      const totalPredictions = user.predictions.length
      return {
        id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Anonymous',
        email: user.email,
        totalPoints,
        totalPredictions,
      }
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)

  const currentUserId = session.user.id

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
          <span className="text-lg">🏆</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-400">Friends & Family Rankings</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {ranked.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No predictions yet. Start predicting!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Player</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Predictions</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((user, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                return (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-50 last:border-0 transition-colors ${
                      user.id === currentUserId ? 'bg-primary-bg hover:bg-primary-bg-hover' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      {medal ? (
                        <span className="text-lg">{medal}</span>
                      ) : (
                        <span className="text-gray-400">#{i + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{user.name}</span>
                      {user.id === currentUserId && (
                        <span className="ml-2 badge bg-primary-bg text-primary">you</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">{user.totalPredictions}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xl font-bold text-primary">{user.totalPoints}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Scoring Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-primary-bg rounded-lg">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">3</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Exact Score</p>
              <p className="text-xs text-gray-500">Perfect prediction</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">1</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Correct Result</p>
              <p className="text-xs text-gray-500">Winner or draw matches</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center text-white text-xs font-bold">0</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Wrong</p>
              <p className="text-xs text-gray-500">Missed the mark</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}