import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    include: {
      predictions: {
        include: {
          match: { select: { stage: true } },
        },
      },
    },
  })

  const ranked = users
    .map((user) => {
      const totalPoints = user.predictions.reduce((sum, p) => sum + p.points, 0)
      const totalPredictions = user.predictions.length
      const perfectPredictions = user.predictions.filter((p) =>
        p.match.stage === 'GROUP_STAGE' ? p.points === 3 : p.points === 5
      ).length
      const normalWins = user.predictions.filter((p) =>
        p.match.stage === 'GROUP_STAGE' ? p.points === 1 : p.points === 2
      ).length
      return {
        id: user.id,
        name: user.name || 'Anonymous',
        totalPoints,
        totalPredictions,
        perfectPredictions,
        normalWins,
      }
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)

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
          <table className="w-fit">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[1%]">#</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Player</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[1%] whitespace-nowrap">Predictions</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[1%] whitespace-nowrap">Perfect</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[1%] whitespace-nowrap">Wins</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[1%] whitespace-nowrap">Points</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((user, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                return (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50"
                  >
                    <td className="px-3 py-3 text-sm font-medium w-[1%]">
                      {medal ? (
                        <span className="text-lg">{medal}</span>
                      ) : (
                        <span className="text-gray-400">#{i + 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-500 w-[1%] whitespace-nowrap">{user.totalPredictions}</td>
                    <td className="px-3 py-3 text-center w-[1%] whitespace-nowrap">
                      <span className="badge bg-amber-50 text-amber-600 font-semibold">{user.perfectPredictions}</span>
                    </td>
                    <td className="px-3 py-3 text-center w-[1%] whitespace-nowrap">
                      <span className="badge bg-green-50 text-green-600 font-semibold">{user.normalWins}</span>
                    </td>
                    <td className="px-3 py-3 text-center w-[1%] whitespace-nowrap">
                      <span className="badge bg-primary-bg text-primary font-semibold">{user.totalPoints}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Scoring Rules — Group Stage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Scoring Rules — Knockout Stage (Round of 32 → Final)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
            <span className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">5</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Exact Score + Correct Advancer</p>
              <p className="text-xs text-gray-500">Perfect regulation score &amp; right team wins (incl. penalties)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">2</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Exact Score OR Correct Advancer</p>
              <p className="text-xs text-gray-500">Perfect regulation score or picked the right winner</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">For draws in regulation, you must also pick the penalty shootout winner.</p>
      </div>
    </div>
  )
}
