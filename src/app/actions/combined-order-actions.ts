"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getDateBounds } from "@/lib/date-utils"
import { ReceiptData } from "@/components/thermal-receipt-modal"

/**
 * Links an existing Restaurant Order and Bar Order together.
 */
export async function linkOrders({
  restaurantOrderId,
  barOrderId
}: {
  restaurantOrderId: string
  barOrderId: string
}) {
  try {
    if (!restaurantOrderId || !barOrderId) {
      return { error: "Both restaurant and bar order IDs are required." }
    }

    const [restaurantOrder, barOrder] = await Promise.all([
      prisma.restaurantOrder.findUnique({ where: { id: restaurantOrderId } }),
      prisma.barOrder.findUnique({ where: { id: barOrderId } })
    ])

    if (!restaurantOrder) return { error: "Restaurant order not found." }
    if (!barOrder) return { error: "Bar order not found." }

    // Link in database
    await prisma.$transaction([
      prisma.restaurantOrder.update({
        where: { id: restaurantOrderId },
        data: { linkedBarOrderId: barOrderId }
      }),
      prisma.barOrder.update({
        where: { id: barOrderId },
        data: { linkedRestaurantOrderId: restaurantOrderId }
      })
    ])

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/restaurant")
    revalidatePath("/dashboard/bar")
    revalidatePath(`/dashboard/restaurant/${restaurantOrderId}/invoice`)
    revalidatePath(`/dashboard/bar/${barOrderId}/invoice`)

    return { success: true }
  } catch (error: any) {
    console.error("Link Orders Error:", error)
    return { error: "Failed to link restaurant and bar orders." }
  }
}

/**
 * Unlinks previously paired orders.
 */
export async function unlinkOrders({
  restaurantOrderId,
  barOrderId
}: {
  restaurantOrderId?: string
  barOrderId?: string
}) {
  try {
    const operations = []

    if (restaurantOrderId) {
      operations.push(
        prisma.restaurantOrder.update({
          where: { id: restaurantOrderId },
          data: { linkedBarOrderId: null }
        })
      )
    }

    if (barOrderId) {
      operations.push(
        prisma.barOrder.update({
          where: { id: barOrderId },
          data: { linkedRestaurantOrderId: null }
        })
      )
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations)
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/restaurant")
    revalidatePath("/dashboard/bar")

    return { success: true }
  } catch (error: any) {
    console.error("Unlink Orders Error:", error)
    return { error: "Failed to unlink orders." }
  }
}

/**
 * Finds unlinked restaurant and bar orders for linking, including automatic smart matches.
 */
export async function getPotentialLinks(dateFilter: string = "today") {
  try {
    const dateBounds = getDateBounds(dateFilter)

    const [restaurantOrders, barOrders] = await Promise.all([
      prisma.restaurantOrder.findMany({
        where: {
          linkedBarOrderId: null,
          ...(dateBounds ? { createdAt: dateBounds } : {})
        },
        orderBy: { createdAt: "desc" },
        include: {
          reservation: {
            include: { room: true, guest: true }
          },
          items: {
            include: { item: true }
          }
        }
      }),
      prisma.barOrder.findMany({
        where: {
          linkedRestaurantOrderId: null,
          ...(dateBounds ? { createdAt: dateBounds } : {})
        },
        orderBy: { createdAt: "desc" },
        include: {
          reservation: {
            include: { room: true, guest: true }
          },
          items: {
            include: { item: true }
          }
        }
      })
    ])

    // Detect smart matches (e.g. same customer name or same room/reservation)
    const smartMatches: {
      restaurantOrder: any
      barOrder: any
      reason: string
    }[] = []

    for (const rest of restaurantOrders) {
      const restCustomer = (rest.customerName || "").trim().toLowerCase()
      const restRoom = rest.reservation?.room?.number

      for (const bar of barOrders) {
        const barCustomer = (bar.customerName || "").trim().toLowerCase()
        const barRoom = bar.reservation?.room?.number

        let matched = false
        let reason = ""

        // Match by room
        if (restRoom && barRoom && restRoom === barRoom) {
          matched = true
          reason = `Same Room (${restRoom})`
        }
        // Match by customer name (if at least 2 chars and not generic walk-in)
        else if (
          restCustomer &&
          barCustomer &&
          restCustomer === barCustomer &&
          !["walk-in", "walkin", "guest", "customer"].includes(restCustomer)
        ) {
          matched = true
          reason = `Same Customer Name ("${rest.customerName}")`
        }

        if (matched) {
          smartMatches.push({
            restaurantOrder: rest,
            barOrder: bar,
            reason
          })
        }
      }
    }

    return {
      smartMatches,
      unlinkedRestaurantOrders: restaurantOrders,
      unlinkedBarOrders: barOrders
    }
  } catch (error) {
    console.error("Get Potential Links Error:", error)
    return {
      smartMatches: [],
      unlinkedRestaurantOrders: [],
      unlinkedBarOrders: []
    }
  }
}

/**
 * Builds unified ReceiptData for two linked (or selected) orders.
 */
export async function getCombinedReceiptData({
  restaurantOrderId,
  barOrderId
}: {
  restaurantOrderId: string
  barOrderId: string
}): Promise<{ success: boolean; error?: string; receiptData?: ReceiptData }> {
  try {
    const [restaurantOrder, barOrder] = await Promise.all([
      prisma.restaurantOrder.findUnique({
        where: { id: restaurantOrderId },
        include: {
          reservation: {
            include: { room: true, guest: true }
          },
          items: {
            include: { item: true }
          }
        }
      }),
      prisma.barOrder.findUnique({
        where: { id: barOrderId },
        include: {
          reservation: {
            include: { room: true, guest: true }
          },
          items: {
            include: { item: true }
          }
        }
      })
    ])

    if (!restaurantOrder || !barOrder) {
      return { success: false, error: "One or both orders could not be found." }
    }

    const orderDate = new Date(restaurantOrder.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

    const customerName =
      restaurantOrder.customerName ||
      barOrder.customerName ||
      (restaurantOrder.reservation?.guest
        ? `${restaurantOrder.reservation.guest.firstName} ${restaurantOrder.reservation.guest.lastName}`
        : barOrder.reservation?.guest
        ? `${barOrder.reservation.guest.firstName} ${barOrder.reservation.guest.lastName}`
        : "Dine-in Guest")

    const roomNumber =
      restaurantOrder.reservation?.room?.number ||
      barOrder.reservation?.room?.number

    const orderType =
      !restaurantOrder.isWalkIn || !barOrder.isWalkIn
        ? `Room Bill (Room ${roomNumber || ""})`
        : "Walk-in Dining & Lounge"

    const foodItems = restaurantOrder.items.map((i) => ({
      name: i.item?.name || "Food Item",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice
    }))

    const barItems = barOrder.items.map((i) => ({
      name: i.item?.name || "Drink Item",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice
    }))

    const totalAmount = restaurantOrder.totalAmount + barOrder.totalAmount

    const paymentStatus =
      restaurantOrder.isWalkIn && barOrder.isWalkIn
        ? "PAID"
        : "CHARGED TO ROOM"

    const receiptData: ReceiptData = {
      title: "COMBINED FOOD & BAR RECEIPT",
      orderNumber: `${restaurantOrder.id.slice(-4).toUpperCase()}-${barOrder.id.slice(-4).toUpperCase()}`,
      date: orderDate,
      customerName,
      roomNumber,
      orderType,
      items: [...foodItems, ...barItems],
      totalAmount,
      paymentStatus,
      sections: [
        {
          title: "KITCHEN & RESTAURANT",
          items: foodItems,
          subtotal: restaurantOrder.totalAmount
        },
        {
          title: "MINI LOUNGE & BAR",
          items: barItems,
          subtotal: barOrder.totalAmount
        }
      ],
      linkedOrderNumbers: {
        restaurant: restaurantOrder.id.slice(-6).toUpperCase(),
        bar: barOrder.id.slice(-6).toUpperCase()
      }
    }

    return { success: true, receiptData }
  } catch (error: any) {
    console.error("Get Combined Receipt Data Error:", error)
    return { success: false, error: "Failed to generate combined receipt data." }
  }
}
