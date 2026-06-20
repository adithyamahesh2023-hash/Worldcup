import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        championTeamId: true,
        championTeam: { select: { id: true, name: true, code: true, flagUrl: true } },
      },
    })
    return NextResponse.json(user)
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      championTeamId: true,
      championTeam: { select: { id: true, name: true, code: true, flagUrl: true } },
    },
  })
  return NextResponse.json(users)
}
