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

const teams = [
  { name: "Algeria", code: "ALG", flagUrl: "https://flagcdn.com/dz.svg" },
  { name: "Argentina", code: "ARG", flagUrl: "https://flagcdn.com/ar.svg" },
  { name: "Australia", code: "AUS", flagUrl: "https://flagcdn.com/au.svg" },
  { name: "Austria", code: "AUT", flagUrl: "https://flagcdn.com/at.svg" },
  { name: "Belgium", code: "BEL", flagUrl: "https://flagcdn.com/be.svg" },
  { name: "Bosnia and Herzegovina", code: "BIH", flagUrl: "https://flagcdn.com/ba.svg" },
  { name: "Brazil", code: "BRA", flagUrl: "https://flagcdn.com/br.svg" },
  { name: "Cape Verde", code: "CPV", flagUrl: "https://flagcdn.com/cv.svg" },
  { name: "Canada", code: "CAN", flagUrl: "https://flagcdn.com/ca.svg" },
  { name: "Colombia", code: "COL", flagUrl: "https://flagcdn.com/co.svg" },
  { name: "Congo DR", code: "COD", flagUrl: "https://flagcdn.com/cd.svg" },
  { name: "Ivory Coast", code: "CIV", flagUrl: "https://flagcdn.com/ci.svg" },
  { name: "Croatia", code: "CRO", flagUrl: "https://flagcdn.com/hr.svg" },
  { name: "Curaçao", code: "CUR", flagUrl: "https://flagcdn.com/cw.svg" },
  { name: "Czechia", code: "CZE", flagUrl: "https://flagcdn.com/cz.svg" },
  { name: "Ecuador", code: "ECU", flagUrl: "https://flagcdn.com/ec.svg" },
  { name: "Egypt", code: "EGY", flagUrl: "https://flagcdn.com/eg.svg" },
  { name: "England", code: "ENG", flagUrl: "https://flagcdn.com/gb-eng.svg" },
  { name: "France", code: "FRA", flagUrl: "https://flagcdn.com/fr.svg" },
  { name: "Germany", code: "GER", flagUrl: "https://flagcdn.com/de.svg" },
  { name: "Ghana", code: "GHA", flagUrl: "https://flagcdn.com/gh.svg" },
  { name: "Haiti", code: "HAI", flagUrl: "https://flagcdn.com/ht.svg" },
  { name: "Iran", code: "IRN", flagUrl: "https://flagcdn.com/ir.svg" },
  { name: "Iraq", code: "IRQ", flagUrl: "https://flagcdn.com/iq.svg" },
  { name: "Japan", code: "JPN", flagUrl: "https://flagcdn.com/jp.svg" },
  { name: "Jordan", code: "JOR", flagUrl: "https://flagcdn.com/jo.svg" },
  { name: "South Korea", code: "KOR", flagUrl: "https://flagcdn.com/kr.svg" },
  { name: "Mexico", code: "MEX", flagUrl: "https://flagcdn.com/mx.svg" },
  { name: "Morocco", code: "MAR", flagUrl: "https://flagcdn.com/ma.svg" },
  { name: "Netherlands", code: "NED", flagUrl: "https://flagcdn.com/nl.svg" },
  { name: "New Zealand", code: "NZL", flagUrl: "https://flagcdn.com/nz.svg" },
  { name: "Norway", code: "NOR", flagUrl: "https://flagcdn.com/no.svg" },
  { name: "Panama", code: "PAN", flagUrl: "https://flagcdn.com/pa.svg" },
  { name: "Paraguay", code: "PAR", flagUrl: "https://flagcdn.com/py.svg" },
  { name: "Portugal", code: "POR", flagUrl: "https://flagcdn.com/pt.svg" },
  { name: "Qatar", code: "QAT", flagUrl: "https://flagcdn.com/qa.svg" },
  { name: "Saudi Arabia", code: "KSA", flagUrl: "https://flagcdn.com/sa.svg" },
  { name: "Scotland", code: "SCO", flagUrl: "https://flagcdn.com/gb-sct.svg" },
  { name: "Senegal", code: "SEN", flagUrl: "https://flagcdn.com/sn.svg" },
  { name: "South Africa", code: "RSA", flagUrl: "https://flagcdn.com/za.svg" },
  { name: "Spain", code: "ESP", flagUrl: "https://flagcdn.com/es.svg" },
  { name: "Sweden", code: "SWE", flagUrl: "https://flagcdn.com/se.svg" },
  { name: "Switzerland", code: "SUI", flagUrl: "https://flagcdn.com/ch.svg" },
  { name: "Tunisia", code: "TUN", flagUrl: "https://flagcdn.com/tn.svg" },
  { name: "Türkiye", code: "TUR", flagUrl: "https://flagcdn.com/tr.svg" },
  { name: "United States", code: "USA", flagUrl: "https://flagcdn.com/us.svg" },
  { name: "Uruguay", code: "URU", flagUrl: "https://flagcdn.com/uy.svg" },
  { name: "Uzbekistan", code: "UZB", flagUrl: "https://flagcdn.com/uz.svg" },
]

async function main() {
  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: { name: team.name, flagUrl: team.flagUrl },
      create: team,
    })
  }
  console.log(`Seeded ${teams.length} teams successfully.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })