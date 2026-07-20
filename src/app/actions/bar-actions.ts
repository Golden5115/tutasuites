"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getBarCatalog() {
  return await prisma.barItem.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  })
}

// For Walk-in or Room
export async function createBarOrder(data: {
  isWalkIn: boolean,
  customerName?: string,
  reservationId?: string,
  items: { itemId: string, quantity: number, unitPrice: number, totalPrice: number }[],
  totalAmount: number
}) {
  try {
    // 1. Create the order
    const order = await prisma.barOrder.create({
      data: {
        isWalkIn: data.isWalkIn,
        customerName: data.customerName,
        reservationId: data.reservationId,
        totalAmount: data.totalAmount,
        status: data.isWalkIn ? "COMPLETED" : "ADDED_TO_ROOM",
        items: {
          create: data.items.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      }
    })

    // 2. Decrement stock
    for (const item of data.items) {
      await prisma.barItem.update({
        where: { id: item.itemId },
        data: { stock: { decrement: item.quantity } }
      })
    }

    // 3. If added to room, update reservation's extrasAmount and totalAmount
    if (!data.isWalkIn && data.reservationId) {
      await prisma.reservation.update({
        where: { id: data.reservationId },
        data: {
          extrasAmount: { increment: data.totalAmount },
          totalAmount: { increment: data.totalAmount }
        }
      })
    }

    revalidatePath("/dashboard/bar")
    if (!data.isWalkIn) {
      revalidatePath("/dashboard")
      revalidatePath("/dashboard/reservations")
    }

    return { success: true, orderId: order.id }
  } catch (error: any) {
    console.error("Bar Order Error:", error)
    return { error: "Failed to process bar order." }
  }
}

export async function addBarItem(data: FormData) {
  const name = data.get("name") as string
  const price = parseFloat(data.get("price") as string)
  const category = data.get("category") as string
  const stock = parseInt(data.get("stock") as string, 10) || 0

  if (!name || isNaN(price)) {
    return { error: "Invalid data" }
  }

  try {
    await prisma.barItem.create({
      data: { name, price, category, stock }
    })
    revalidatePath("/dashboard/settings/bar-catalog")
    revalidatePath("/dashboard/bar")
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { error: "Item name already exists" }
    return { error: "Failed to add item" }
  }
}

export async function updateBarItem(data: FormData) {
  const id = data.get("id") as string
  const name = data.get("name") as string
  const price = parseFloat(data.get("price") as string)
  const category = data.get("category") as string
  const stock = parseInt(data.get("stock") as string, 10) || 0

  if (!id || !name || isNaN(price)) {
    return { error: "Invalid data" }
  }

  try {
    await prisma.barItem.update({
      where: { id },
      data: { name, price, category, stock }
    })
    revalidatePath("/dashboard/settings/bar-catalog")
    revalidatePath("/dashboard/bar")
    return { success: true }
  } catch (e) {
    return { error: "Failed to update item" }
  }
}

export async function deleteBarItem(id: string) {
  try {
    await prisma.barItem.delete({ where: { id } })
    revalidatePath("/dashboard/settings/bar-catalog")
    revalidatePath("/dashboard/bar")
    return { success: true }
  } catch (e) {
    return { error: "Failed to delete item" }
  }
}

export async function getRecentBarOrders() {
  return await prisma.barOrder.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      reservation: {
        include: { room: true }
      },
      items: {
        include: { item: true }
      }
    }
  })
}
