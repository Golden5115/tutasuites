"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function addExpense(data: any) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
      },
    })
    revalidatePath("/dashboard/finance")
    return { success: true, expense }
  } catch (error: any) {
    console.error(error)
    return { error: "Failed to add expense" }
  }
}

export async function deleteExpense(id: string) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.expense.delete({
      where: { id },
    })
    revalidatePath("/dashboard/finance")
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: "Failed to delete expense" }
  }
}
