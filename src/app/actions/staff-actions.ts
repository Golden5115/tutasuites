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

  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = (formData.get("password") as string)?.trim()
  const role = formData.get("role") as Role
  const modules = formData.getAll("modules") as string[]

  if (!name || !email || !password || !role) {
    return { error: "Please fill in all required fields." }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { error: "Email is already registered by another staff account." }
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
    console.error("Error creating staff:", err)
    return { error: "Failed to create staff member." }
  }

  revalidatePath("/dashboard/staff")
  redirect("/dashboard/staff")
}

export async function updateStaffAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return { error: "Unauthorized. Admin privileges required." }
  }

  const userId = formData.get("userId") as string
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = (formData.get("password") as string)?.trim()
  const role = formData.get("role") as Role
  const isActive = formData.get("isActive") === "true"
  const modules = formData.getAll("modules") as string[]

  if (!userId || !name || !email || !role) {
    return { error: "Please fill in all required fields." }
  }

  const currentUserId = (session.user as any).id

  try {
    const existingStaff = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingStaff) {
      return { error: "Staff member not found." }
    }

    // Check email uniqueness if email changed
    if (email !== existingStaff.email.toLowerCase()) {
      const emailInUse = await prisma.user.findUnique({
        where: { email },
      })
      if (emailInUse) {
        return { error: "Email address is already registered by another account." }
      }
    }

    // Guard against self-lockout or removing the last admin
    if (currentUserId === userId) {
      if (!isActive) {
        return { error: "You cannot deactivate your own account." }
      }
      if (role !== "ADMIN") {
        const otherAdmins = await prisma.user.count({
          where: { role: "ADMIN", id: { not: userId }, isActive: true },
        })
        if (otherAdmins === 0) {
          return { error: "You cannot remove Admin privileges from the only active Administrator account." }
        }
      }
    }

    // Handle password hashing if a new password was provided
    let hashedPassword: string | undefined = undefined
    if (password && password.length > 0) {
      if (password.length < 6) {
        return { error: "New password must be at least 6 characters long." }
      }
      hashedPassword = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        modules,
        isActive,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
    })
  } catch (err) {
    console.error("Error updating staff member:", err)
    return { error: "Failed to update staff member. Please try again." }
  }

  revalidatePath("/dashboard/staff")
  revalidatePath(`/dashboard/staff/${userId}/edit`)
  redirect("/dashboard/staff")
}

export async function deleteStaffAction(userId: string) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." }
  }

  const currentUserId = (session.user as any).id

  if (currentUserId === userId) {
    return {
      success: false,
      error: "You cannot delete your own account.",
    }
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return { success: false, error: "Staff account not found." }
    }

    // Check if user is an admin and the only admin
    if (targetUser.role === "ADMIN") {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true },
      })
      if (activeAdminCount <= 1) {
        return {
          success: false,
          error: "Cannot delete the only active Administrator account.",
        }
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/dashboard/staff")
    return { success: true }
  } catch (error) {
    console.error("Error deleting staff member:", error)
    return { success: false, error: "Failed to delete staff account. Please try again." }
  }
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

