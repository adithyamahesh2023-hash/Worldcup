import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

export async function GET() {
  const teams = await prisma.team.findMany({ orderBy: { group: 'asc' } })
  return NextResponse.json(teams)
}

export async function POST(req: Request) {
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
  const body = await req.json()
  const { id, group } = body
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }
  const data: Prisma.TeamUncheckedUpdateInput = {}
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
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ success: true })
}