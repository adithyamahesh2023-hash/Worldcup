import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { PrismaPlanetScale } from '@prisma/adapter-planetscale'
import { Client } from '@planetscale/database'

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

const prisma = new PrismaClient({ adapter: getAdapter() })

async function main() {
  const email = process.argv[2] || ''

  if (!email) {
    console.error('Usage: npx tsx prisma/seed.ts <admin-email>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`User with email "${email}" not found.`)
    console.error('Sign in first with magic link, then run this script again.')
    process.exit(1)
  }

  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  })

  console.log(`User "${email}" is now an ADMIN.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })