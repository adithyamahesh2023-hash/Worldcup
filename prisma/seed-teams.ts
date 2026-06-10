import "dotenv/config"
import { PrismaClient } from '@prisma/client'

function getAdapter() {
  const url = process.env.DATABASE_URL || ''

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

const prisma = new PrismaClient({ adapter: getAdapter() })

const teams = [
  { name: 'Brazil', code: 'BRA', group: null },
  { name: 'Argentina', code: 'ARG', group: null },
  { name: 'France', code: 'FRA', group: null },
  { name: 'England', code: 'ENG', group: null },
  { name: 'Germany', code: 'GER', group: null },
  { name: 'Spain', code: 'ESP', group: null },
  { name: 'Portugal', code: 'POR', group: null },
  { name: 'Netherlands', code: 'NED', group: null },
  { name: 'Italy', code: 'ITA', group: null },
  { name: 'Belgium', code: 'BEL', group: null },
  { name: 'Croatia', code: 'CRO', group: null },
  { name: 'Switzerland', code: 'SUI', group: null },
  { name: 'Uruguay', code: 'URU', group: null },
  { name: 'Denmark', code: 'DEN', group: null },
  { name: 'Mexico', code: 'MEX', group: null },
  { name: 'USA', code: 'USA', group: null },
  { name: 'Japan', code: 'JPN', group: null },
  { name: 'South Korea', code: 'KOR', group: null },
  { name: 'Saudi Arabia', code: 'KSA', group: null },
  { name: 'Iran', code: 'IRN', group: null },
  { name: 'Australia', code: 'AUS', group: null },
  { name: 'Morocco', code: 'MAR', group: null },
  { name: 'Senegal', code: 'SEN', group: null },
  { name: 'Nigeria', code: 'NGA', group: null },
  { name: 'Cameroon', code: 'CMR', group: null },
  { name: 'Ivory Coast', code: 'CIV', group: null },
  { name: 'Ghana', code: 'GHA', group: null },
  { name: 'Egypt', code: 'EGY', group: null },
  { name: 'Tunisia', code: 'TUN', group: null },
  { name: 'Algeria', code: 'ALG', group: null },
  { name: 'Cape Verde', code: 'CPV', group: null },
  { name: 'Canada', code: 'CAN', group: null },
  { name: 'Costa Rica', code: 'CRC', group: null },
  { name: 'Panama', code: 'PAN', group: null },
  { name: 'Jamaica', code: 'JAM', group: null },
  { name: 'Ecuador', code: 'ECU', group: null },
  { name: 'Peru', code: 'PER', group: null },
  { name: 'Colombia', code: 'COL', group: null },
  { name: 'Paraguay', code: 'PAR', group: null },
  { name: 'Venezuela', code: 'VEN', group: null },
  { name: 'New Zealand', code: 'NZL', group: null },
  { name: 'Fiji', code: 'FIJ', group: null },
  { name: 'Tahiti', code: 'TAH', group: null },
  { name: 'Solomon Islands', code: 'SOL', group: null },
  { name: 'Guinea', code: 'GUI', group: null },
  { name: 'DR Congo', code: 'COD', group: null },
  { name: 'Mali', code: 'MLI', group: null },
  { name: 'Burkina Faso', code: 'BFA', group: null },
]

async function main() {
  for (const team of teams) {
    const flagUrl = `https://flagcdn.com/w80/${team.code.toLowerCase()}.png`
    const exists = await prisma.team.findUnique({ where: { code: team.code } })
    if (!exists) {
      await prisma.team.create({ data: { ...team, flagUrl } })
      console.log(`Added ${team.name}`)
    } else {
      console.log(`Skipped ${team.name} (already exists)`)
    }
  }

  const count = await prisma.team.count()
  console.log(`\nDone! ${count} teams in database.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
