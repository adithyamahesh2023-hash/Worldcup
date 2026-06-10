import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const teams = [
  { name: 'Mexico', code: 'MEX', group: 'A', flagUrl: 'https://flagcdn.com/w80/mx.png' },
  { name: 'South Korea', code: 'KOR', group: 'A', flagUrl: 'https://flagcdn.com/w80/kr.png' },
  { name: 'South Africa', code: 'RSA', group: 'A', flagUrl: 'https://flagcdn.com/w80/za.png' },
  { name: 'Czechia', code: 'CZE', group: 'A', flagUrl: 'https://flagcdn.com/w80/cz.png' },

  { name: 'Canada', code: 'CAN', group: 'B', flagUrl: 'https://flagcdn.com/w80/ca.png' },
  { name: 'Switzerland', code: 'SUI', group: 'B', flagUrl: 'https://flagcdn.com/w80/ch.png' },
  { name: 'Qatar', code: 'QAT', group: 'B', flagUrl: 'https://flagcdn.com/w80/qa.png' },
  { name: 'Bosnia & Herzegovina', code: 'BIH', group: 'B', flagUrl: 'https://flagcdn.com/w80/ba.png' },

  { name: 'Brazil', code: 'BRA', group: 'C', flagUrl: 'https://flagcdn.com/w80/br.png' },
  { name: 'Morocco', code: 'MAR', group: 'C', flagUrl: 'https://flagcdn.com/w80/ma.png' },
  { name: 'Scotland', code: 'SCO', group: 'C', flagUrl: 'https://flagcdn.com/w80/gb-sct.png' },
  { name: 'Haiti', code: 'HAI', group: 'C', flagUrl: 'https://flagcdn.com/w80/ht.png' },

  { name: 'United States', code: 'USA', group: 'D', flagUrl: 'https://flagcdn.com/w80/us.png' },
  { name: 'Australia', code: 'AUS', group: 'D', flagUrl: 'https://flagcdn.com/w80/au.png' },
  { name: 'Paraguay', code: 'PAR', group: 'D', flagUrl: 'https://flagcdn.com/w80/py.png' },
  { name: 'Türkiye', code: 'TUR', group: 'D', flagUrl: 'https://flagcdn.com/w80/tr.png' },

  { name: 'Germany', code: 'GER', group: 'E', flagUrl: 'https://flagcdn.com/w80/de.png' },
  { name: 'Ecuador', code: 'ECU', group: 'E', flagUrl: 'https://flagcdn.com/w80/ec.png' },
  { name: 'Ivory Coast', code: 'CIV', group: 'E', flagUrl: 'https://flagcdn.com/w80/ci.png' },
  { name: 'Curaçao', code: 'CUW', group: 'E', flagUrl: 'https://flagcdn.com/w80/cw.png' },

  { name: 'Netherlands', code: 'NED', group: 'F', flagUrl: 'https://flagcdn.com/w80/nl.png' },
  { name: 'Japan', code: 'JPN', group: 'F', flagUrl: 'https://flagcdn.com/w80/jp.png' },
  { name: 'Tunisia', code: 'TUN', group: 'F', flagUrl: 'https://flagcdn.com/w80/tn.png' },
  { name: 'Sweden', code: 'SWE', group: 'F', flagUrl: 'https://flagcdn.com/w80/se.png' },

  { name: 'Belgium', code: 'BEL', group: 'G', flagUrl: 'https://flagcdn.com/w80/be.png' },
  { name: 'Iran', code: 'IRN', group: 'G', flagUrl: 'https://flagcdn.com/w80/ir.png' },
  { name: 'Egypt', code: 'EGY', group: 'G', flagUrl: 'https://flagcdn.com/w80/eg.png' },
  { name: 'New Zealand', code: 'NZL', group: 'G', flagUrl: 'https://flagcdn.com/w80/nz.png' },

  { name: 'Spain', code: 'ESP', group: 'H', flagUrl: 'https://flagcdn.com/w80/es.png' },
  { name: 'Uruguay', code: 'URU', group: 'H', flagUrl: 'https://flagcdn.com/w80/uy.png' },
  { name: 'Saudi Arabia', code: 'KSA', group: 'H', flagUrl: 'https://flagcdn.com/w80/sa.png' },
  { name: 'Cape Verde', code: 'CPV', group: 'H', flagUrl: 'https://flagcdn.com/w80/cv.png' },

  { name: 'France', code: 'FRA', group: 'I', flagUrl: 'https://flagcdn.com/w80/fr.png' },
  { name: 'Senegal', code: 'SEN', group: 'I', flagUrl: 'https://flagcdn.com/w80/sn.png' },
  { name: 'Norway', code: 'NOR', group: 'I', flagUrl: 'https://flagcdn.com/w80/no.png' },
  { name: 'Iraq', code: 'IRQ', group: 'I', flagUrl: 'https://flagcdn.com/w80/iq.png' },

  { name: 'Argentina', code: 'ARG', group: 'J', flagUrl: 'https://flagcdn.com/w80/ar.png' },
  { name: 'Austria', code: 'AUT', group: 'J', flagUrl: 'https://flagcdn.com/w80/at.png' },
  { name: 'Algeria', code: 'ALG', group: 'J', flagUrl: 'https://flagcdn.com/w80/dz.png' },
  { name: 'Jordan', code: 'JOR', group: 'J', flagUrl: 'https://flagcdn.com/w80/jo.png' },

  { name: 'Portugal', code: 'POR', group: 'K', flagUrl: 'https://flagcdn.com/w80/pt.png' },
  { name: 'Colombia', code: 'COL', group: 'K', flagUrl: 'https://flagcdn.com/w80/co.png' },
  { name: 'Uzbekistan', code: 'UZB', group: 'K', flagUrl: 'https://flagcdn.com/w80/uz.png' },
  { name: 'Congo DR', code: 'COD', group: 'K', flagUrl: 'https://flagcdn.com/w80/cd.png' },

  { name: 'England', code: 'ENG', group: 'L', flagUrl: 'https://flagcdn.com/w80/gb-eng.png' },
  { name: 'Croatia', code: 'CRO', group: 'L', flagUrl: 'https://flagcdn.com/w80/hr.png' },
  { name: 'Panama', code: 'PAN', group: 'L', flagUrl: 'https://flagcdn.com/w80/pa.png' },
  { name: 'Ghana', code: 'GHA', group: 'L', flagUrl: 'https://flagcdn.com/w80/gh.png' },
]

async function main() {
  for (const team of teams) {
    const exists = await prisma.team.findUnique({ where: { code: team.code } })
    if (!exists) {
      await prisma.team.create({ data: team })
      console.log(`Added ${team.name} (Group ${team.group})`)
    } else {
      await prisma.team.update({
        where: { code: team.code },
        data: { name: team.name, group: team.group, flagUrl: team.flagUrl },
      })
      console.log(`Updated ${team.name} (Group ${team.group})`)
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
