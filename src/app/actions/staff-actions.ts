"use server"

import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export async function createStaffAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as Role
  const modules = formData.getAll("modules") as string[]

  if (!name || !email || !password || !role) {
    return { error: "Please fill in all required fields." }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { error: "Email is already in use." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        modules,
      },
    })
  } catch (err) {
    console.error(err)
    return { error: "Failed to create staff member." }
  }

  redirect("/dashboard/staff")
}
