import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { matchId, team1Score, team2Score } = await req.json()

  if (!matchId || team1Score === undefined || team2Score === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (typeof team1Score !== 'number' || typeof team2Score !== 'number') {
    return NextResponse.json({ error: 'Scores must be numbers' }, { status: 400 })
  }

  if (team1Score < 0 || team2Score < 0 || team1Score > 20 || team2Score > 20) {
    return NextResponse.json({ error: 'Scores must be between 0 and 20' }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } })

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  if (match.status !== 'SCHEDULED') {
    return NextResponse.json({ error: 'Match has already started or finished' }, { status: 400 })
  }

  if (new Date(match.matchDate) < new Date()) {
    return NextResponse.json({ error: 'Match has already started' }, { status: 400 })
  }

  const prediction = await prisma.prediction.upsert({
    where: {
      userId_matchId: {
        userId: session.user.id,
        matchId,
      },
    },
    update: {
      team1Score,
      team2Score,
      points: 0,
    },
    create: {
      userId: session.user.id,
      matchId,
      team1Score,
      team2Score,
    },
  })

  return NextResponse.json(prediction)
}