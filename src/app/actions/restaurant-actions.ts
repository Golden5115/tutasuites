"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getDateBounds } from "@/lib/date-utils"

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

export async function getRestaurantOrders(options?: { dateFilter?: string; limit?: number }) {
  const dateBounds = getDateBounds(options?.dateFilter || "today")
  
  return await prisma.restaurantOrder.findMany({
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

export async function getRestaurantOrderById(id: string) {
  return await prisma.restaurantOrder.findUnique({
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

export async function getRestaurantAnalytics(dateFilter: string = "today") {
  const dateBounds = getDateBounds(dateFilter)
  
  const orders = await prisma.restaurantOrder.findMany({
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
  const comboMap: Record<string, { combo: string; count: number }> = {}

  for (const order of orders) {
    totalRevenue += order.totalAmount
    if (order.isWalkIn) {
      walkInRevenue += order.totalAmount
      walkInCount++
    } else {
      roomChargeRevenue += order.totalAmount
      roomChargeCount++
    }

    const uniqueItemNames = Array.from(new Set(order.items.map(i => i.item?.name).filter(Boolean))) as string[]

    for (const orderItem of order.items) {
      const itemName = orderItem.item?.name || "Unknown Item"
      const category = orderItem.item?.category || "Food"
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

    // Identify food combos (pairs ordered together)
    if (uniqueItemNames.length > 1) {
      for (let i = 0; i < uniqueItemNames.length; i++) {
        for (let j = i + 1; j < uniqueItemNames.length; j++) {
          const comboKey = [uniqueItemNames[i], uniqueItemNames[j]].sort().join(" + ")
          if (!comboMap[comboKey]) {
            comboMap[comboKey] = { combo: comboKey, count: 0 }
          }
          comboMap[comboKey].count++
        }
      }
    }
  }

  const itemsSold = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity)
  const topItems = itemsSold.slice(0, 8)
  const topCombos = Object.values(comboMap).sort((a, b) => b.count - a.count).slice(0, 6)

  return {
    totalRevenue,
    totalOrders: orders.length,
    walkInRevenue,
    walkInCount,
    roomChargeRevenue,
    roomChargeCount,
    itemsSold,
    topItems,
    topCombos,
  }
}
