"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getDateBounds } from "@/lib/date-utils"

export interface POSCartItem {
  itemId: string
  name: string
  catalogType: "RESTAURANT" | "BAR"
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface CreatePOSOrderInput {
  isWalkIn: boolean
  customerName?: string
  reservationId?: string
  items: POSCartItem[]
  totalAmount: number
}

/**
 * Loads both food and drink catalogs plus occupied rooms in a single query
 */
export async function getUnifiedPOSData() {
  const [foodCatalog, drinksCatalog, occupiedRooms] = await Promise.all([
    prisma.restaurantItem.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.barItem.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.room.findMany({
      where: {
        status: "OCCUPIED",
        reservations: {
          some: {
            status: "CHECKED_IN",
          },
        },
      },
      include: {
        reservations: {
          where: { status: "CHECKED_IN" },
          include: {
            guest: true,
          },
        },
      },
      orderBy: { number: "asc" },
    }),
  ])

  return {
    foodCatalog: foodCatalog.map((item) => ({ ...item, catalogType: "RESTAURANT" as const })),
    drinksCatalog: drinksCatalog.map((item) => ({ ...item, catalogType: "BAR" as const })),
    occupiedRooms,
  }
}

/**
 * Creates a unified POS order.
 * - If food only: creates RestaurantOrder
 * - If drinks only: creates BarOrder
 * - If both food & drinks: creates both in an atomic transaction, linked bidirectionally
 *   and with a single room charge update.
 */
export async function createUnifiedPOSOrder(data: CreatePOSOrderInput) {
  try {
    if (!data.items || data.items.length === 0) {
      return { error: "Cart is empty. Please add items to checkout." }
    }

    const foodItems = data.items.filter((i) => i.catalogType === "RESTAURANT")
    const barItems = data.items.filter((i) => i.catalogType === "BAR")

    const foodTotal = foodItems.reduce((sum, i) => sum + i.totalPrice, 0)
    const barTotal = barItems.reduce((sum, i) => sum + i.totalPrice, 0)

    // CASE 1: BOTH FOOD AND DRINKS (UNIFIED MEAL & BAR ORDER)
    if (foodItems.length > 0 && barItems.length > 0) {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Restaurant Order
        const restOrder = await tx.restaurantOrder.create({
          data: {
            isWalkIn: data.isWalkIn,
            customerName: data.customerName,
            reservationId: data.reservationId,
            totalAmount: foodTotal,
            status: data.isWalkIn ? "COMPLETED" : "ADDED_TO_ROOM",
            items: {
              create: foodItems.map((item) => ({
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            },
          },
        })

        // 2. Create Bar Order linked to Restaurant Order
        const barOrder = await tx.barOrder.create({
          data: {
            isWalkIn: data.isWalkIn,
            customerName: data.customerName,
            reservationId: data.reservationId,
            totalAmount: barTotal,
            status: data.isWalkIn ? "COMPLETED" : "ADDED_TO_ROOM",
            linkedRestaurantOrderId: restOrder.id,
            items: {
              create: barItems.map((item) => ({
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            },
          },
        })

        // 3. Bidirectionally link the Restaurant Order to the Bar Order
        await tx.restaurantOrder.update({
          where: { id: restOrder.id },
          data: { linkedBarOrderId: barOrder.id },
        })

        // 4. Decrement food stocks
        for (const item of foodItems) {
          await tx.restaurantItem.update({
            where: { id: item.itemId },
            data: { stock: { decrement: item.quantity } },
          })
        }

        // 5. Decrement bar stocks
        for (const item of barItems) {
          await tx.barItem.update({
            where: { id: item.itemId },
            data: { stock: { decrement: item.quantity } },
          })
        }

        // 6. Update reservation total (Single charge for both food + drinks)
        if (!data.isWalkIn && data.reservationId) {
          await tx.reservation.update({
            where: { id: data.reservationId },
            data: {
              extrasAmount: { increment: data.totalAmount },
              totalAmount: { increment: data.totalAmount },
            },
          })
        }

        return { restOrder, barOrder }
      })

      revalidatePath("/dashboard/pos")
      revalidatePath("/dashboard/restaurant")
      revalidatePath("/dashboard/bar")
      revalidatePath("/dashboard/finance")
      if (!data.isWalkIn) {
        revalidatePath("/dashboard")
        revalidatePath("/dashboard/reservations")
      }

      const combinedOrderNumber = `F${result.restOrder.id.slice(-4).toUpperCase()}-B${result.barOrder.id.slice(-4).toUpperCase()}`

      return {
        success: true,
        orderId: combinedOrderNumber,
        restaurantOrderId: result.restOrder.id,
        barOrderId: result.barOrder.id,
        isCombined: true,
        receiptData: {
          title: "RESTAURANT & BAR RECEIPT",
          orderNumber: combinedOrderNumber,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          orderType: data.isWalkIn ? "Walk-in (Paid)" : "Charged to Room",
          customerName: data.customerName || "Walk-in Guest",
          totalAmount: data.totalAmount,
          paymentStatus: data.isWalkIn ? "COMPLETED" : "CHARGED TO ROOM",
          sections: [
            {
              title: "KITCHEN & RESTAURANT",
              items: foodItems.map((f) => ({
                name: f.name,
                quantity: f.quantity,
                unitPrice: f.unitPrice,
                totalPrice: f.totalPrice,
              })),
              subtotal: foodTotal,
            },
            {
              title: "MINI LOUNGE & BAR",
              items: barItems.map((b) => ({
                name: b.name,
                quantity: b.quantity,
                unitPrice: b.unitPrice,
                totalPrice: b.totalPrice,
              })),
              subtotal: barTotal,
            },
          ],
          linkedOrderNumbers: {
            restaurant: result.restOrder.id.slice(-6).toUpperCase(),
            bar: result.barOrder.id.slice(-6).toUpperCase(),
          },
        },
      }
    }

    // CASE 2: FOOD ONLY ORDER
    if (foodItems.length > 0 && barItems.length === 0) {
      const restOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.restaurantOrder.create({
          data: {
            isWalkIn: data.isWalkIn,
            customerName: data.customerName,
            reservationId: data.reservationId,
            totalAmount: foodTotal,
            status: data.isWalkIn ? "COMPLETED" : "ADDED_TO_ROOM",
            items: {
              create: foodItems.map((item) => ({
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            },
          },
        })

        for (const item of foodItems) {
          await tx.restaurantItem.update({
            where: { id: item.itemId },
            data: { stock: { decrement: item.quantity } },
          })
        }

        if (!data.isWalkIn && data.reservationId) {
          await tx.reservation.update({
            where: { id: data.reservationId },
            data: {
              extrasAmount: { increment: foodTotal },
              totalAmount: { increment: foodTotal },
            },
          })
        }

        return order
      })

      revalidatePath("/dashboard/pos")
      revalidatePath("/dashboard/restaurant")
      revalidatePath("/dashboard/finance")
      if (!data.isWalkIn) {
        revalidatePath("/dashboard")
        revalidatePath("/dashboard/reservations")
      }

      return {
        success: true,
        orderId: restOrder.id,
        restaurantOrderId: restOrder.id,
        isCombined: false,
        receiptData: {
          title: "RESTAURANT RECEIPT",
          orderNumber: restOrder.id.slice(-6).toUpperCase(),
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          orderType: data.isWalkIn ? "Walk-in (Paid)" : "Charged to Room",
          customerName: data.customerName || "Walk-in Guest",
          totalAmount: foodTotal,
          paymentStatus: data.isWalkIn ? "COMPLETED" : "CHARGED TO ROOM",
          items: foodItems.map((f) => ({
            name: f.name,
            quantity: f.quantity,
            unitPrice: f.unitPrice,
            totalPrice: f.totalPrice,
          })),
        },
      }
    }

    // CASE 3: DRINKS ONLY ORDER
    if (barItems.length > 0 && foodItems.length === 0) {
      const barOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.barOrder.create({
          data: {
            isWalkIn: data.isWalkIn,
            customerName: data.customerName,
            reservationId: data.reservationId,
            totalAmount: barTotal,
            status: data.isWalkIn ? "COMPLETED" : "ADDED_TO_ROOM",
            items: {
              create: barItems.map((item) => ({
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            },
          },
        })

        for (const item of barItems) {
          await tx.barItem.update({
            where: { id: item.itemId },
            data: { stock: { decrement: item.quantity } },
          })
        }

        if (!data.isWalkIn && data.reservationId) {
          await tx.reservation.update({
            where: { id: data.reservationId },
            data: {
              extrasAmount: { increment: barTotal },
              totalAmount: { increment: barTotal },
            },
          })
        }

        return order
      })

      revalidatePath("/dashboard/pos")
      revalidatePath("/dashboard/bar")
      revalidatePath("/dashboard/finance")
      if (!data.isWalkIn) {
        revalidatePath("/dashboard")
        revalidatePath("/dashboard/reservations")
      }

      return {
        success: true,
        orderId: barOrder.id,
        barOrderId: barOrder.id,
        isCombined: false,
        receiptData: {
          title: "MINI LOUNGE RECEIPT",
          orderNumber: barOrder.id.slice(-6).toUpperCase(),
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          orderType: data.isWalkIn ? "Walk-in (Paid)" : "Charged to Room",
          customerName: data.customerName || "Walk-in Guest",
          totalAmount: barTotal,
          paymentStatus: data.isWalkIn ? "COMPLETED" : "CHARGED TO ROOM",
          items: barItems.map((b) => ({
            name: b.name,
            quantity: b.quantity,
            unitPrice: b.unitPrice,
            totalPrice: b.totalPrice,
          })),
        },
      }
    }

    return { error: "No valid items in order." }
  } catch (error: any) {
    console.error("Unified POS Order Error:", error)
    return { error: error.message || "Failed to process POS order." }
  }
}

/**
 * Gets unified sales history aggregating both Restaurant and Bar orders
 */
export async function getUnifiedSalesHistory(options?: { dateFilter?: string }) {
  const dateBounds = getDateBounds(options?.dateFilter || "today")

  const [restaurantOrders, barOrders] = await Promise.all([
    prisma.restaurantOrder.findMany({
      where: dateBounds ? { createdAt: dateBounds } : {},
      include: {
        items: { include: { item: true } },
        reservation: { include: { room: true, guest: true } },
        linkedBarOrder: {
          include: {
            items: { include: { item: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.barOrder.findMany({
      where: dateBounds ? { createdAt: dateBounds } : {},
      include: {
        items: { include: { item: true } },
        reservation: { include: { room: true, guest: true } },
        linkedRestaurantOrder: {
          include: {
            items: { include: { item: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Aggregate unified metrics
  const restRevenue = restaurantOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const barRevenue = barOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalRevenue = restRevenue + barRevenue

  const restWalkIn = restaurantOrders.filter((o) => o.isWalkIn).reduce((sum, o) => sum + o.totalAmount, 0)
  const barWalkIn = barOrders.filter((o) => o.isWalkIn).reduce((sum, o) => sum + o.totalAmount, 0)
  const walkInRevenue = restWalkIn + barWalkIn

  const restRoom = restaurantOrders.filter((o) => !o.isWalkIn).reduce((sum, o) => sum + o.totalAmount, 0)
  const barRoom = barOrders.filter((o) => !o.isWalkIn).reduce((sum, o) => sum + o.totalAmount, 0)
  const roomChargeRevenue = restRoom + barRoom

  return {
    restaurantOrders,
    barOrders,
    analytics: {
      totalRevenue,
      foodRevenue: restRevenue,
      drinksRevenue: barRevenue,
      totalOrders: restaurantOrders.length + barOrders.length,
      walkInRevenue,
      roomChargeRevenue,
    },
  }
}
