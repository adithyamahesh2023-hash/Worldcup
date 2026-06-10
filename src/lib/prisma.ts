import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getAdapter() {
  const url = process.env.DATABASE_URL || ''
  const parsed = new URL(url)
  return new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  } as any)
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: getAdapter() })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma