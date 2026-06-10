import { PrismaClient } from '@prisma/client'
import { PrismaPlanetScale } from '@prisma/adapter-planetscale'
import { Client } from '@planetscale/database'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getAdapter() {
  const url = process.env.DATABASE_URL || ''
  const parsed = new URL(url)
  const client = new Client({
    host: parsed.hostname,
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  })
  return new PrismaPlanetScale(client)
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: getAdapter() })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
