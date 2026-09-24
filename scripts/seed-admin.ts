import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tutasuites.com' },
    update: {},
    create: {
      email: 'admin@tutasuites.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      modules: ['RESERVATIONS', 'GUESTS', 'ROOMS', 'SETTINGS', 'STAFF'],
    },
  })

  console.log('Admin user seeded:', admin.email)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
