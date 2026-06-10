import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getAdapter() {
  const url = process.env.DATABASE_URL || ''
  const pool = new Pool({ connectionString: url })
  return new PrismaPg(pool)
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: getAdapter() })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
