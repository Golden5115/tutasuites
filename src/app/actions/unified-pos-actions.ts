"use server"

import fs from "fs"
import path from "path"
import { auth } from "@/auth"
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
 * Gets unified sales history aggregating both Restaurant and Bar orders into a single sorted list
 */
export async function getUnifiedPOSSalesHistory(options?: { dateFilter?: string; limit?: number }) {
  const dateBounds = getDateBounds(options?.dateFilter || "today")

  const [restaurantOrders, barOrders] = await Promise.all([
    prisma.restaurantOrder.findMany({
      where: dateBounds ? { createdAt: dateBounds } : {},
      take: options?.limit || 200,
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
      take: options?.limit || 200,
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

  const linkedBarIds = new Set(restaurantOrders.map((r) => r.linkedBarOrderId).filter(Boolean))

  const formattedRestOrders = restaurantOrders.map((order) => ({
    ...order,
    orderCategory: (order.linkedBarOrder ? "COMBINED" : "RESTAURANT") as "COMBINED" | "RESTAURANT",
    foodAmount: order.totalAmount,
    barAmount: order.linkedBarOrder ? order.linkedBarOrder.totalAmount : 0,
  }))

  const barOnlyOrders = barOrders
    .filter((order) => !order.linkedRestaurantOrderId && !linkedBarIds.has(order.id))
    .map((order) => ({
      ...order,
      orderCategory: "BAR" as const,
      foodAmount: 0,
      barAmount: order.totalAmount,
    }))

  const allOrders = [...formattedRestOrders, ...barOnlyOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return allOrders
}

/**
 * Gets unified analytics aggregating both Kitchen food and Bar drinks revenue & statistics
 */
export async function getUnifiedPOSAnalytics(dateFilter: string = "today") {
  const dateBounds = getDateBounds(dateFilter)

  const [restaurantOrders, barOrders] = await Promise.all([
    prisma.restaurantOrder.findMany({
      where: dateBounds ? { createdAt: dateBounds } : undefined,
      include: {
        items: { include: { item: true } },
        linkedBarOrder: {
          include: {
            items: { include: { item: true } },
          },
        },
      },
    }),
    prisma.barOrder.findMany({
      where: dateBounds ? { createdAt: dateBounds } : undefined,
      include: {
        items: { include: { item: true } },
        linkedRestaurantOrder: {
          include: {
            items: { include: { item: true } },
          },
        },
      },
    }),
  ])

  const foodRevenue = restaurantOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const drinksRevenue = barOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalRevenue = foodRevenue + drinksRevenue

  const restWalkIn = restaurantOrders.filter((o) => o.isWalkIn).reduce((sum, o) => sum + o.totalAmount, 0)
  const barWalkIn = barOrders.filter((o) => o.isWalkIn).reduce((sum, o) => sum + o.totalAmount, 0)
  const walkInRevenue = restWalkIn + barWalkIn

  const restRoom = restaurantOrders.filter((o) => !o.isWalkIn).reduce((sum, o) => sum + o.totalAmount, 0)
  const barRoom = barOrders.filter((o) => !o.isWalkIn).reduce((sum, o) => sum + o.totalAmount, 0)
  const roomChargeRevenue = restRoom + barRoom

  const linkedBarIds = new Set(restaurantOrders.map((r) => r.linkedBarOrderId).filter(Boolean))
  const unlinkedBarOrders = barOrders.filter((b) => !b.linkedRestaurantOrderId && !linkedBarIds.has(b.id))

  const totalOrders = restaurantOrders.length + unlinkedBarOrders.length
  const walkInCount =
    restaurantOrders.filter((o) => o.isWalkIn).length + unlinkedBarOrders.filter((o) => o.isWalkIn).length
  const roomChargeCount =
    restaurantOrders.filter((o) => !o.isWalkIn).length + unlinkedBarOrders.filter((o) => !o.isWalkIn).length

  const itemMap: Record<
    string,
    { name: string; category: string; quantity: number; revenue: number; type: "FOOD" | "DRINK" }
  > = {}
  const comboMap: Record<string, { combo: string; count: number }> = {}

  for (const order of restaurantOrders) {
    const uniqueFood = Array.from(new Set(order.items.map((i) => i.item?.name).filter(Boolean))) as string[]
    const uniqueDrinks = order.linkedBarOrder
      ? (Array.from(new Set(order.linkedBarOrder.items.map((i) => i.item?.name).filter(Boolean))) as string[])
      : []

    for (const orderItem of order.items) {
      const name = orderItem.item?.name || "Kitchen Item"
      const category = orderItem.item?.category || "Food"
      if (!itemMap[name]) {
        itemMap[name] = { name, category, quantity: 0, revenue: 0, type: "FOOD" }
      }
      itemMap[name].quantity += orderItem.quantity
      itemMap[name].revenue += orderItem.totalPrice
    }

    const allItemNames = [...uniqueFood, ...uniqueDrinks]
    if (allItemNames.length > 1) {
      for (let i = 0; i < allItemNames.length; i++) {
        for (let j = i + 1; j < allItemNames.length; j++) {
          const comboKey = [allItemNames[i], allItemNames[j]].sort().join(" + ")
          if (!comboMap[comboKey]) {
            comboMap[comboKey] = { combo: comboKey, count: 0 }
          }
          comboMap[comboKey].count++
        }
      }
    }
  }

  for (const order of barOrders) {
    for (const orderItem of order.items) {
      const name = orderItem.item?.name || "Drink Item"
      const category = orderItem.item?.category || "Drinks"
      if (!itemMap[name]) {
        itemMap[name] = { name, category, quantity: 0, revenue: 0, type: "DRINK" }
      }
      itemMap[name].quantity += orderItem.quantity
      itemMap[name].revenue += orderItem.totalPrice
    }

    if (!order.linkedRestaurantOrderId && !linkedBarIds.has(order.id)) {
      const uniqueDrinks = Array.from(new Set(order.items.map((i) => i.item?.name).filter(Boolean))) as string[]
      if (uniqueDrinks.length > 1) {
        for (let i = 0; i < uniqueDrinks.length; i++) {
          for (let j = i + 1; j < uniqueDrinks.length; j++) {
            const comboKey = [uniqueDrinks[i], uniqueDrinks[j]].sort().join(" + ")
            if (!comboMap[comboKey]) {
              comboMap[comboKey] = { combo: comboKey, count: 0 }
            }
            comboMap[comboKey].count++
          }
        }
      }
    }
  }

  const itemsSold = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity)
  const topItems = itemsSold.slice(0, 8)
  const topCombos = Object.values(comboMap).sort((a, b) => b.count - a.count).slice(0, 6)

  return {
    totalRevenue,
    foodRevenue,
    drinksRevenue,
    totalOrders,
    walkInRevenue,
    walkInCount,
    roomChargeRevenue,
    roomChargeCount,
    itemsSold,
    topItems,
    topCombos,
  }
}

const DRAFTS_DIR = path.join(process.cwd(), ".pos-drafts")

export interface PendingOrderItem {
  itemId: string
  name: string
  catalogType: "RESTAURANT" | "BAR"
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface PendingOrderEntry {
  staffId: string
  staffName: string
  staffEmail: string
  staffRole: string
  tabId: string
  orderName: string
  orderType: "WALKIN" | "ROOM"
  customerName: string
  selectedRoomId: string
  roomNumber?: string
  totalItemsCount: number
  items: PendingOrderItem[]
  foodSubtotal: number
  drinksSubtotal: number
  grandTotal: number
  isSaved?: boolean
  savedAt?: string
  updatedAt: string
  rawTab: any
}

/**
 * Save in-progress order drafts for the authenticated user.
 * Stores staff metadata so Admins can audit all active pending orders across the property.
 */
export async function saveUserPOSDrafts(tabs: any[]) {
  const session = await auth()
  const user = session?.user as any
  const userId = user?.id || user?.email
  if (!userId) return { success: false, error: "Unauthorized" }

  try {
    if (!fs.existsSync(DRAFTS_DIR)) {
      fs.mkdirSync(DRAFTS_DIR, { recursive: true })
    }
    const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "_")
    const filePath = path.join(DRAFTS_DIR, `${safeId}.json`)

    const data = {
      userId: String(userId),
      userName: user.name || user.email || "Staff",
      userEmail: user.email || "",
      userRole: user.role || "FRONT_DESK",
      updatedAt: new Date().toISOString(),
      tabs,
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8")
    return { success: true }
  } catch (err: any) {
    console.error("Failed to save POS drafts:", err)
    return { success: false, error: err.message }
  }
}

/**
 * Retrieve in-progress order drafts for the authenticated user.
 * Isolated strictly to the requesting user.
 */
export async function getUserPOSDrafts() {
  const session = await auth()
  const user = session?.user as any
  const userId = user?.id || user?.email
  if (!userId) return { tabs: [] }

  try {
    const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "_")
    const filePath = path.join(DRAFTS_DIR, `${safeId}.json`)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8")
      const parsed = JSON.parse(content || "{}")
      const tabs = Array.isArray(parsed) ? parsed : (parsed.tabs || [])
      return { tabs }
    }
  } catch (err: any) {
    console.error("Failed to read POS drafts:", err)
  }
  return { tabs: [] }
}

/**
 * Clear in-progress order drafts for the authenticated user when completed.
 */
export async function clearUserPOSDrafts() {
  const session = await auth()
  const user = session?.user as any
  const userId = user?.id || user?.email
  if (!userId) return { success: false }

  try {
    const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "_")
    const filePath = path.join(DRAFTS_DIR, `${safeId}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return { success: true }
  } catch (err) {
    return { success: false }
  }
}

/**
 * Retrieve ALL active in-progress and held orders across all staff users.
 * Strictly available to ADMIN users.
 */
export async function getAllPendingPOSOrders(): Promise<{ pendingOrders: PendingOrderEntry[]; error?: string }> {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.role !== "ADMIN") {
    return { pendingOrders: [], error: "Admin authorization required." }
  }

  try {
    const pendingOrders: PendingOrderEntry[] = []

    // Fetch occupied rooms for room number lookup
    const occupiedRooms = await prisma.room.findMany({
      select: { id: true, number: true },
    })
    const roomMap = new Map(occupiedRooms.map((r) => [r.id, r.number]))

    if (fs.existsSync(DRAFTS_DIR)) {
      const files = fs.readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".json"))

      for (const file of files) {
        try {
          const filePath = path.join(DRAFTS_DIR, file)
          const rawContent = fs.readFileSync(filePath, "utf8")
          const parsed = JSON.parse(rawContent || "{}")
          const tabs = Array.isArray(parsed) ? parsed : (parsed.tabs || [])
          const staffName = parsed.userName || parsed.userEmail || "Staff"
          const staffEmail = parsed.userEmail || ""
          const staffRole = parsed.userRole || "FRONT_DESK"
          const staffId = parsed.userId || file.replace(".json", "")
          const updatedAt = parsed.updatedAt || new Date().toISOString()

          for (const tab of tabs) {
            // Only consider tabs with items in cart
            if (Array.isArray(tab.cart) && tab.cart.length > 0) {
              const items: PendingOrderItem[] = tab.cart.map((c: any) => {
                const unitPrice = c.customPrice ?? c.item?.price ?? 0
                return {
                  itemId: c.item?.id || "",
                  name: c.item?.name || "Item",
                  catalogType: c.catalogType || "RESTAURANT",
                  category: c.item?.category || (c.catalogType === "RESTAURANT" ? "Food" : "Drink"),
                  quantity: c.quantity || 1,
                  unitPrice,
                  totalPrice: unitPrice * (c.quantity || 1),
                }
              })

              const foodSubtotal = items
                .filter((i) => i.catalogType === "RESTAURANT")
                .reduce((sum, i) => sum + i.totalPrice, 0)

              const drinksSubtotal = items
                .filter((i) => i.catalogType === "BAR")
                .reduce((sum, i) => sum + i.totalPrice, 0)

              const grandTotal = foodSubtotal + drinksSubtotal
              const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0)

              pendingOrders.push({
                staffId,
                staffName,
                staffEmail,
                staffRole,
                tabId: tab.id,
                orderName: tab.name || "Order",
                orderType: tab.orderType || "WALKIN",
                customerName: tab.customerName || "",
                selectedRoomId: tab.selectedRoomId || "",
                roomNumber: tab.selectedRoomId ? roomMap.get(tab.selectedRoomId) : undefined,
                totalItemsCount,
                items,
                foodSubtotal,
                drinksSubtotal,
                grandTotal,
                isSaved: tab.isSaved,
                savedAt: tab.savedAt,
                updatedAt,
                rawTab: tab,
              })
            }
          }
        } catch (fileErr) {
          console.warn(`Could not parse draft file ${file}:`, fileErr)
        }
      }
    }

    // Sort by most recently updated
    pendingOrders.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return { pendingOrders }
  } catch (err: any) {
    console.error("Failed to fetch all pending POS orders:", err)
    return { pendingOrders: [], error: err.message }
  }
}

/**
 * Admin action to discard an active pending order held by a staff member.
 */
export async function discardStaffDraftTab(staffId: string, tabId: string) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.role !== "ADMIN") {
    return { success: false, error: "Admin authorization required." }
  }

  try {
    const safeId = String(staffId).replace(/[^a-zA-Z0-9_-]/g, "_")
    const filePath = path.join(DRAFTS_DIR, `${safeId}.json`)
    if (fs.existsSync(filePath)) {
      const rawContent = fs.readFileSync(filePath, "utf8")
      const parsed = JSON.parse(rawContent || "{}")
      const tabs = Array.isArray(parsed) ? parsed : (parsed.tabs || [])
      const remainingTabs = tabs.filter((t: any) => t.id !== tabId)

      if (remainingTabs.length === 0) {
        fs.unlinkSync(filePath)
      } else {
        if (Array.isArray(parsed)) {
          fs.writeFileSync(filePath, JSON.stringify(remainingTabs, null, 2), "utf8")
        } else {
          parsed.tabs = remainingTabs
          parsed.updatedAt = new Date().toISOString()
          fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), "utf8")
        }
      }
      return { success: true }
    }
    return { success: false, error: "Draft not found." }
  } catch (err: any) {
    console.error("Error discarding staff draft:", err)
    return { success: false, error: err.message }
  }
}
