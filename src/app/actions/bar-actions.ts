"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getDateBounds } from "@/lib/date-utils"

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

export async function getBarOrders(options?: { dateFilter?: string; limit?: number }) {
  const dateBounds = getDateBounds(options?.dateFilter || "today")
  
  return await prisma.barOrder.findMany({
    where: dateBounds ? { createdAt: dateBounds } : undefined,
    take: options?.limit || 100,
    orderBy: { createdAt: 'desc' },
    include: {
      reservation: {
        include: { room: true, guest: true }
      },
      items: {
        include: { item: true }
      }
    }
  })
}

export async function getBarOrderById(id: string) {
  return await prisma.barOrder.findUnique({
    where: { id },
    include: {
      reservation: {
        include: { room: true, guest: true }
      },
      items: {
        include: { item: true }
      }
    }
  })
}

export async function getBarAnalytics(dateFilter: string = "today") {
  const dateBounds = getDateBounds(dateFilter)
  
  const orders = await prisma.barOrder.findMany({
    where: dateBounds ? { createdAt: dateBounds } : undefined,
    include: {
      items: {
        include: { item: true }
      }
    }
  })

  let totalRevenue = 0
  let walkInRevenue = 0
  let walkInCount = 0
  let roomChargeRevenue = 0
  let roomChargeCount = 0

  const itemMap: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {}

  for (const order of orders) {
    totalRevenue += order.totalAmount
    if (order.isWalkIn) {
      walkInRevenue += order.totalAmount
      walkInCount++
    } else {
      roomChargeRevenue += order.totalAmount
      roomChargeCount++
    }

    for (const orderItem of order.items) {
      const itemName = orderItem.item?.name || "Unknown Item"
      const category = orderItem.item?.category || "Drinks"
      if (!itemMap[itemName]) {
        itemMap[itemName] = {
          name: itemName,
          category,
          quantity: 0,
          revenue: 0
        }
      }
      itemMap[itemName].quantity += orderItem.quantity
      itemMap[itemName].revenue += orderItem.totalPrice
    }
  }

  const itemsSold = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity)
  const topItems = itemsSold.slice(0, 8)

  return {
    totalRevenue,
    totalOrders: orders.length,
    walkInRevenue,
    walkInCount,
    roomChargeRevenue,
    roomChargeCount,
    itemsSold,
    topItems,
  }
}
