import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

export async function GET() {
  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true },
    orderBy: { matchDate: 'asc' },
  })
  return NextResponse.json(matches)
}

export async function POST(req: Request) {
  const { team1Id, team2Id, matchDate, stage, group } = await req.json()

  if (!team1Id || !team2Id || !stage) {
    return NextResponse.json({ error: 'team1Id, team2Id, and stage are required' }, { status: 400 })
  }

  if (team1Id === team2Id) {
    return NextResponse.json({ error: 'Teams must be different' }, { status: 400 })
  }

  const match = await prisma.match.create({
    data: {
      team1Id,
      team2Id,
      matchDate: matchDate ? new Date(matchDate) : new Date(),
      stage,
      group: group || null,
      visible: false,
    },
    include: { team1: true, team2: true },
  })

  return NextResponse.json(match)
}

export async function PUT(req: Request) {
  const { id, team1Id, team2Id, matchDate, stage, group, venue, team1Score, team2Score, team1Penalties, team2Penalties, status, visible } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const updateData: Prisma.MatchUncheckedUpdateInput = {}
  if (team1Id !== undefined) updateData.team1Id = team1Id
  if (team2Id !== undefined) updateData.team2Id = team2Id
  if (matchDate !== undefined) updateData.matchDate = new Date(matchDate)
  if (stage !== undefined) updateData.stage = stage
  if (group !== undefined) updateData.group = group || null
  if (team1Score !== undefined) updateData.team1Score = team1Score
  if (team2Score !== undefined) updateData.team2Score = team2Score
  if (team1Penalties !== undefined) updateData.team1Penalties = team1Penalties
  if (team2Penalties !== undefined) updateData.team2Penalties = team2Penalties
  if (status !== undefined) updateData.status = status
  if (visible !== undefined) updateData.visible = visible

  if (status === 'FINISHED' && team1Score !== null && team2Score !== null) {
    updateData.team1Score = team1Score
    updateData.team2Score = team2Score
  }

  const match = await prisma.match.update({
    where: { id },
    data: updateData,
    include: { team1: true, team2: true },
  })

  if (match.status === 'FINISHED' && match.team1Score !== null && match.team2Score !== null) {
    await recalculatePoints({
      id: match.id,
      team1Score: match.team1Score,
      team2Score: match.team2Score,
      team1Penalties: match.team1Penalties,
      team2Penalties: match.team2Penalties,
      stage: match.stage,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
    })
  }

  return NextResponse.json(match)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }
  await prisma.prediction.deleteMany({ where: { matchId: id } })
  await prisma.match.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

function isKnockout(stage: string) {
  return stage !== 'GROUP_STAGE'
}

async function recalculatePoints(match: { id: string; team1Score: number; team2Score: number; team1Penalties: number | null; team2Penalties: number | null; stage: string; team1Id: string; team2Id: string }) {
  const { id: matchId, team1Score: actualHome, team2Score: actualAway, team1Penalties, team2Penalties, stage, team1Id, team2Id } = match
  const predictions = await prisma.prediction.findMany({ where: { matchId } })

  const actualIsDraw = actualHome === actualAway
  const actualAdvancer = actualIsDraw
    ? (team1Penalties !== null && team2Penalties !== null
        ? (team1Penalties > team2Penalties ? team1Id : team2Id)
        : null)
    : (actualHome > actualAway ? team1Id : team2Id)

  for (const prediction of predictions) {
    let points = 0

    if (isKnockout(stage)) {
      const predictedIsDraw = prediction.team1Score === prediction.team2Score
      const predictedAdvancer = predictedIsDraw
        ? prediction.penaltyWinnerTeamId
        : (prediction.team1Score > prediction.team2Score ? team1Id : team2Id)

      const exactScore = prediction.team1Score === actualHome && prediction.team2Score === actualAway
      const correctAdvancer = predictedAdvancer !== null && predictedAdvancer === actualAdvancer

      if (exactScore && correctAdvancer) {
        points = 5
      } else if (exactScore || correctAdvancer) {
        points = 2
      }
    } else {
      if (prediction.team1Score === actualHome && prediction.team2Score === actualAway) {
        points = 3
      } else {
        const actualResult = actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw'
        const predictedResult = prediction.team1Score > prediction.team2Score ? 'home' : prediction.team1Score < prediction.team2Score ? 'away' : 'draw'
        if (actualResult === predictedResult) {
          points = 1
        }
      }
    }

    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { points },
    })
  }
}
