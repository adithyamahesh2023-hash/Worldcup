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
  const teams = await prisma.team.findMany({ orderBy: { group: 'asc' } })
  return NextResponse.json(teams)
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name, code, flagUrl, group } = await req.json()
  if (!name || !code) {
    return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
  }
  const team = await prisma.team.create({
    data: { name, code: code.toUpperCase(), flagUrl, group: group || null },
  })
  return NextResponse.json(team)
}

export async function PUT(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { id, group } = body
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.code !== undefined) data.code = body.code.toUpperCase()
  if (body.flagUrl !== undefined) data.flagUrl = body.flagUrl
  if (body.group !== undefined) data.group = body.group || null
  const team = await prisma.team.update({
    where: { id },
    data,
  })
  return NextResponse.json(team)
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
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ success: true })
}