import 'dotenv/config'
import { prisma } from './src/lib/prisma'

async function main() {
  await prisma.roomType.update({
    where: { slug: 'classic-suite' },
    data: { images: ['/classic.jpeg'] }
  })
  console.log("Updated Classic Suite image successfully.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
