import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  const userId = searchParams.get('userId')

  if (userId) {
    const predictions = await prisma.prediction.findMany({
      where: { userId },
      select: { matchId: true, team1Score: true, team2Score: true, penaltyWinnerTeamId: true, points: true },
    })
    return NextResponse.json(predictions)
  }

  if (!matchId) {
    return NextResponse.json({ error: 'matchId or userId is required' }, { status: 400 })
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    select: { userId: true, team1Score: true, team2Score: true, penaltyWinnerTeamId: true, points: true },
  })
  return NextResponse.json(predictions)
}

export async function POST(req: Request) {
  const { matchId, team1Score, team2Score, userId, penaltyWinnerTeamId } = await req.json()
  const targetUserId = userId || ''

  if (!matchId || team1Score === undefined || team2Score === undefined || !targetUserId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (typeof team1Score !== 'number' || typeof team2Score !== 'number') {
    return NextResponse.json({ error: 'Scores must be numbers' }, { status: 400 })
  }

  if (team1Score < 0 || team2Score < 0) {
    return NextResponse.json({ error: 'Scores cannot be negative' }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const updateData: Prisma.PredictionUncheckedUpdateInput = { team1Score, team2Score, points: 0 }
  if (penaltyWinnerTeamId !== undefined) {
    updateData.penaltyWinnerTeamId = penaltyWinnerTeamId || null
  }

  const createData: Prisma.PredictionUncheckedCreateInput = { userId: targetUserId, matchId, team1Score, team2Score }
  if (penaltyWinnerTeamId) {
    createData.penaltyWinnerTeamId = penaltyWinnerTeamId
  }

  const prediction = await prisma.prediction.upsert({
    where: {
      userId_matchId: {
        userId: targetUserId,
        matchId,
      },
    },
    update: updateData,
    create: createData,
  })

  return NextResponse.json(prediction)
}
