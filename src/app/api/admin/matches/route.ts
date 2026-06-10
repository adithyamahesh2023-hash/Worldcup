import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function checkAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return false
  }
  return true
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true },
    orderBy: { matchDate: 'asc' },
  })
  return NextResponse.json(matches)
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { team1Id, team2Id, matchDate, stage, group } = await req.json()

  if (!team1Id || !team2Id || !matchDate || !stage) {
    return NextResponse.json({ error: 'team1Id, team2Id, matchDate, and stage are required' }, { status: 400 })
  }

  if (team1Id === team2Id) {
    return NextResponse.json({ error: 'Teams must be different' }, { status: 400 })
  }

  const match = await prisma.match.create({
    data: {
      team1Id,
      team2Id,
      matchDate: new Date(matchDate),
      stage,
      group: group || null,
      visible: false,
    },
    include: { team1: true, team2: true },
  })

  return NextResponse.json(match)
}

export async function PUT(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, team1Id, team2Id, matchDate, stage, group, venue, team1Score, team2Score, status, visible } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const updateData: any = {}
  if (team1Id !== undefined) updateData.team1Id = team1Id
  if (team2Id !== undefined) updateData.team2Id = team2Id
  if (matchDate !== undefined) updateData.matchDate = new Date(matchDate)
  if (stage !== undefined) updateData.stage = stage
  if (group !== undefined) updateData.group = group || null
  if (team1Score !== undefined) updateData.team1Score = team1Score
  if (team2Score !== undefined) updateData.team2Score = team2Score
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
    await recalculatePoints(match.id, match.team1Score, match.team2Score)
  }

  return NextResponse.json(match)
}

export async function DELETE(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }
  await prisma.prediction.deleteMany({ where: { matchId: id } })
  await prisma.match.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

async function recalculatePoints(matchId: string, actualHome: number, actualAway: number) {
  const predictions = await prisma.prediction.findMany({ where: { matchId } })

  for (const prediction of predictions) {
    let points = 0
    if (prediction.team1Score === actualHome && prediction.team2Score === actualAway) {
      points = 3
    } else {
      const actualResult = actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw'
      const predictedResult = prediction.team1Score > prediction.team2Score ? 'home' : prediction.team1Score < prediction.team2Score ? 'away' : 'draw'
      if (actualResult === predictedResult) {
        points = 1
      }
    }
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { points },
    })
  }
}