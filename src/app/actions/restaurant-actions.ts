"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getRestaurantCatalog() {
  return await prisma.restaurantItem.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  })
}

export async function createRestaurantOrder(data: {
  isWalkIn: boolean,
  customerName?: string,
  reservationId?: string,
  items: { itemId: string, quantity: number, unitPrice: number, totalPrice: number }[],
  totalAmount: number
}) {
  try {
    const order = await prisma.restaurantOrder.create({
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

    for (const item of data.items) {
      await prisma.restaurantItem.update({
        where: { id: item.itemId },
        data: { stock: { decrement: item.quantity } }
      })
    }

    if (!data.isWalkIn && data.reservationId) {
      await prisma.reservation.update({
        where: { id: data.reservationId },
        data: {
          extrasAmount: { increment: data.totalAmount },
          totalAmount: { increment: data.totalAmount }
        }
      })
    }

    revalidatePath("/dashboard/restaurant")
    if (!data.isWalkIn) {
      revalidatePath("/dashboard")
      revalidatePath("/dashboard/reservations")
    }

    return { success: true, orderId: order.id }
  } catch (error: any) {
    console.error("Restaurant Order Error:", error)
    return { error: "Failed to process restaurant order." }
  }
}

export async function addRestaurantItem(data: FormData) {
  const name = data.get("name") as string
  const price = parseFloat(data.get("price") as string)
  const category = data.get("category") as string
  const stock = parseInt(data.get("stock") as string, 10) || 0

  if (!name || isNaN(price)) {
    return { error: "Invalid data" }
  }

  try {
    await prisma.restaurantItem.create({
      data: { name, price, category, stock }
    })
    revalidatePath("/dashboard/settings/restaurant-catalog")
    revalidatePath("/dashboard/restaurant")
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { error: "Item name already exists" }
    return { error: "Failed to add item" }
  }
}

export async function updateRestaurantItem(data: FormData) {
  const id = data.get("id") as string
  const name = data.get("name") as string
  const price = parseFloat(data.get("price") as string)
  const category = data.get("category") as string
  const stock = parseInt(data.get("stock") as string, 10) || 0

  if (!id || !name || isNaN(price)) {
    return { error: "Invalid data" }
  }

  try {
    await prisma.restaurantItem.update({
      where: { id },
      data: { name, price, category, stock }
    })
    revalidatePath("/dashboard/settings/restaurant-catalog")
    revalidatePath("/dashboard/restaurant")
    return { success: true }
  } catch (e) {
    return { error: "Failed to update item" }
  }
}

export async function deleteRestaurantItem(id: string) {
  try {
    await prisma.restaurantItem.delete({ where: { id } })
    revalidatePath("/dashboard/settings/restaurant-catalog")
    revalidatePath("/dashboard/restaurant")
    return { success: true }
  } catch (e) {
    return { error: "Failed to delete item" }
  }
}
