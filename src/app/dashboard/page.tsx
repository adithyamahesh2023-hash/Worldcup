import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import MatchList from './MatchList'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const matches = await prisma.match.findMany({
    where: { visible: true },
    include: {
      team1: true,
      team2: true,
      predictions: {
        where: { userId: session.user.id },
      },
    },
    orderBy: { matchDate: 'asc' },
  })

  const now = new Date()

  const matchesWithPrediction = matches.map((match) => ({
    ...match,
    matchDate: match.matchDate.toISOString(),
    userPrediction: match.predictions[0] || null,
    isPast: new Date(match.matchDate) < now,
  }))

  return <MatchList matches={matchesWithPrediction} userId={session.user.id} />
}