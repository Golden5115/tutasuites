"use server"

import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function createStaffAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return { error: "Unauthorized. Admin privileges required." }
  }

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
        isActive: true,
      },
    })
  } catch (err) {
    console.error(err)
    return { error: "Failed to create staff member." }
  }

  revalidatePath("/dashboard/staff")
  redirect("/dashboard/staff")
}

export async function toggleStaffStatusAction(userId: string, targetStatus: boolean) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." }
  }

  const currentUserId = (session.user as any).id

  if (currentUserId === userId && !targetStatus) {
    return {
      success: false,
      error: "You cannot deactivate your own account.",
    }
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return { success: false, error: "Staff member not found." }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: targetStatus },
    })

    revalidatePath("/dashboard/staff")
    return { success: true }
  } catch (error) {
    console.error("Error toggling staff status:", error)
    return { success: false, error: "Failed to update staff status." }
  }
}
