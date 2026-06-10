import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getAdapter() {
  const url = process.env.DATABASE_URL || ''

  // PlanetScale adapter for Vercel/PlanetScale deployments
  if (url.includes('planetscale.com')) {
    // eslint-disable-next-line
    const { PrismaPlanetScale } = require('@prisma/adapter-planetscale')
    // eslint-disable-next-line
    const { Client } = require('@planetscale/database')
    const parsed = new URL(url)
    const client = new Client({
      host: parsed.hostname,
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
    })
    return new PrismaPlanetScale(client)
  }

  // MariaDB adapter for local development
  // eslint-disable-next-line
  const { PrismaMariaDb } = require('@prisma/adapter-mariadb')
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
