import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      championTeamId: true,
      championTeam: { select: { id: true, name: true, code: true, flagUrl: true } },
    },
  })
  return NextResponse.json(user)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name } = await req.json()
  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  const cleaned = name.trim().slice(0, 30)
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: cleaned },
    select: { name: true, email: true },
  })
  return NextResponse.json(user)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { championTeamId } = await req.json()

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { championTeamId: true },
  })
  if (existing?.championTeamId) {
    return NextResponse.json({ error: 'Champion pick is already locked and cannot be changed' }, { status: 400 })
  }

  if (!championTeamId) {
    return NextResponse.json({ error: 'Team is required' }, { status: 400 })
  }

  const team = await prisma.team.findUnique({ where: { id: championTeamId } })
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { championTeamId },
    select: {
      name: true,
      email: true,
      championTeamId: true,
      championTeam: { select: { id: true, name: true, code: true, flagUrl: true } },
    },
  })
  return NextResponse.json(user)
}
