import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      championTeamId: true,
      championTeam: { select: { id: true, name: true, code: true, flagUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const { name } = await req.json()
  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  const cleaned = name.trim().slice(0, 30)
  const fakeEmail = `user_${Date.now()}@local`
  const user = await prisma.user.create({
    data: { name: cleaned, email: fakeEmail, emailVerified: new Date() },
    select: { id: true, name: true, email: true, role: true },
  })
  return NextResponse.json(user)
}

export async function PUT(req: Request) {
  const { id, championTeamId } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }
  const user = await prisma.user.update({
    where: { id },
    data: { championTeamId: championTeamId || null },
    select: { id: true, name: true, championTeamId: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }
  await prisma.prediction.deleteMany({ where: { userId: id } })
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
