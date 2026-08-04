import 'dotenv/config'
import { prisma } from './src/lib/prisma'

async function main() {
  await prisma.roomType.update({
    where: { slug: 'premium-suite' },
    data: { images: ['/premium.jpeg'] }
  })
  console.log("Updated Premium Suite image successfully.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
