import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@tutasuites.com' } })
  if (!user) {
    console.log("USER DOES NOT EXIST")
    return
  }
  console.log("USER EXISTS:", user.email, "Role:", user.role)
  const match = await bcrypt.compare('admin123', user.password!)
  console.log("PASSWORD MATCH:", match)
}

main().catch(console.error).finally(() => process.exit(0))
