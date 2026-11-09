"use server"

import crypto from "crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getDateBounds } from "@/lib/date-utils"

export interface GrabAndGoMenuItem {
  id: string
  name: string
  price: number
  category: string
  isAvailable: boolean
  stock: number
}

export interface GrabAndGoCartEntry {
  itemId: string
  name: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface CreateGrabAndGoOrderInput {
  customerName?: string
  orderType: "TAKEAWAY" | "EAT_IN"
  paymentMethod: "CASH" | "POS" | "TRANSFER"
  notes?: string
  items: GrabAndGoCartEntry[]
  totalAmount: number
}

const DEFAULT_GRAB_AND_GO_ITEMS: Array<{
  name: string
  price: number
  category: string
  stock: number
}> = [
  // Rice
  { name: "Jollof Rice", price: 500, category: "Rice", stock: 500 },
  { name: "Fried Rice", price: 500, category: "Rice", stock: 500 },
  { name: "Native Rice", price: 700, category: "Rice", stock: 500 },
  { name: "White Rice", price: 500, category: "Rice", stock: 500 },

  // Swallow
  { name: "Eba", price: 500, category: "Swallow", stock: 500 },
  { name: "Semo", price: 500, category: "Swallow", stock: 500 },
  { name: "Poundo", price: 700, category: "Swallow", stock: 500 },

  // Soups (Free with Swallow default, editable anytime)
  { name: "Egusi Soup", price: 0, category: "Soups", stock: 500 },
  { name: "Efo Riro", price: 0, category: "Soups", stock: 500 },

  // Protein
  { name: "Egg", price: 500, category: "Protein", stock: 500 },
  { name: "Beef", price: 500, category: "Protein", stock: 500 },
  { name: "Goat Meat", price: 1000, category: "Protein", stock: 500 },
  { name: "Fish", price: 1500, category: "Protein", stock: 500 },
  { name: "Chicken", price: 3000, category: "Protein", stock: 500 },
  { name: "Turkey", price: 4000, category: "Protein", stock: 500 },

  // Sides
  { name: "Shawarma", price: 2500, category: "Sides", stock: 500 },
  { name: "Plantain", price: 500, category: "Sides", stock: 500 },
  { name: "Salad", price: 500, category: "Sides", stock: 500 },

  // Extras
  { name: "Water (Small / Sachet)", price: 200, category: "Extras", stock: 500 },
  { name: "Take Away", price: 300, category: "Extras", stock: 1000 },

  // Drinks
  { name: "Coke", price: 500, category: "Drinks", stock: 500 },
  { name: "Sprite", price: 500, category: "Drinks", stock: 500 },
  { name: "Juice", price: 1500, category: "Drinks", stock: 500 },
  { name: "Bottled Water", price: 300, category: "Drinks", stock: 500 },
  { name: "Zobo", price: 1000, category: "Drinks", stock: 500 },
]

let ensurePromise: Promise<void> | null = null

/**
 * Ensures PostgreSQL tables exist for Tuta Grab & Go and seeds the initial menu if empty.
 * Uses a shared singleton promise so concurrent Promise.all() calls never race on DDL.
 */
async function ensureGrabAndGoTablesAndSeed() {
  if (!ensurePromise) {
    ensurePromise = runEnsureGrabAndGoTablesAndSeed().catch(() => {
      ensurePromise = null
    })
  }
  return ensurePromise
}

async function runEnsureGrabAndGoTablesAndSeed() {
  const regCheck = await prisma.$queryRawUnsafe<Array<{ reg: string | null }>>(
    `SELECT to_regclass('public."GrabAndGoOrderItem"')::text as reg`
  )
  const tableAlreadyExists = Boolean(regCheck?.[0]?.reg)

  if (!tableAlreadyExists) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GrabAndGoItem" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'Rice',
        "isAvailable" BOOLEAN NOT NULL DEFAULT true,
        "stock" INTEGER NOT NULL DEFAULT 500,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GrabAndGoItem_pkey" PRIMARY KEY ("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "GrabAndGoItem_name_key" ON "GrabAndGoItem"("name");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GrabAndGoOrder" (
        "id" TEXT NOT NULL,
        "orderNumber" TEXT NOT NULL,
        "customerName" TEXT,
        "orderType" TEXT NOT NULL DEFAULT 'TAKEAWAY',
        "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
        "cashierName" TEXT,
        "status" TEXT NOT NULL DEFAULT 'COMPLETED',
        "totalAmount" DOUBLE PRECISION NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GrabAndGoOrder_pkey" PRIMARY KEY ("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "GrabAndGoOrder_orderNumber_key" ON "GrabAndGoOrder"("orderNumber");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GrabAndGoOrderItem" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "itemId" TEXT NOT NULL,
        "itemName" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "unitPrice" DOUBLE PRECISION NOT NULL,
        "totalPrice" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GrabAndGoOrderItem_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "GrabAndGoOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "GrabAndGoOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "GrabAndGoOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GrabAndGoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `)
  }

  const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
    `SELECT COUNT(*)::int as count FROM "GrabAndGoItem"`
  )
  const existingCount = Number(countRows?.[0]?.count ?? 0)

  if (existingCount === 0) {
    for (const item of DEFAULT_GRAB_AND_GO_ITEMS) {
      const id = `gg_${crypto.randomBytes(8).toString("hex")}`
      await prisma.$executeRawUnsafe(
        `INSERT INTO "GrabAndGoItem" ("id", "name", "price", "category", "isAvailable", "stock", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("name") DO NOTHING`,
        id,
        item.name,
        item.price,
        item.category,
        item.stock
      )
    }
  }
}

const CATEGORY_ORDER: Record<string, number> = {
  Rice: 1,
  Swallow: 2,
  Soups: 3,
  Protein: 4,
  Sides: 5,
  Extras: 6,
  Drinks: 7,
}

export async function getGrabAndGoCatalog(): Promise<GrabAndGoMenuItem[]> {
  await ensureGrabAndGoTablesAndSeed()

  const items = await prisma.$queryRawUnsafe<GrabAndGoMenuItem[]>(
    `SELECT "id", "name", "price", "category", "isAvailable", "stock" FROM "GrabAndGoItem" ORDER BY "name" ASC`
  )

  return (items || [])
    .map((item) => ({
      ...item,
      price: Number(item.price),
      stock: Number(item.stock),
      isAvailable: Boolean(item.isAvailable),
    }))
    .sort((a, b) => {
      const orderA = CATEGORY_ORDER[a.category] || 99
      const orderB = CATEGORY_ORDER[b.category] || 99
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
}

async function hasSettingsPermission(): Promise<boolean> {
  const session = await auth()
  const user = session?.user as any
  return Boolean(
    session && (user?.role === "ADMIN" || (user?.modules || []).includes("SETTINGS"))
  )
}

export async function seedDefaultGrabAndGoCatalog() {
  if (!(await hasSettingsPermission())) {
    return { error: "Unauthorized. Only Settings / Administrators can modify the price list." }
  }
  await ensureGrabAndGoTablesAndSeed()

  try {
    for (const item of DEFAULT_GRAB_AND_GO_ITEMS) {
      const id = `gg_${crypto.randomBytes(8).toString("hex")}`
      await prisma.$executeRawUnsafe(
        `INSERT INTO "GrabAndGoItem" ("id", "name", "price", "category", "isAvailable", "stock", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("name") DO UPDATE SET
           "price" = EXCLUDED."price",
           "category" = EXCLUDED."category",
           "isAvailable" = true,
           "updatedAt" = CURRENT_TIMESTAMP`,
        id,
        item.name,
        item.price,
        item.category,
        item.stock
      )
    }
    revalidatePath("/dashboard/grab-and-go")
    revalidatePath("/dashboard/settings/grab-and-go-catalog")
    return { success: true }
  } catch (err: any) {
    console.error("Failed to seed Grab & Go catalog:", err)
    return { error: "Failed to restore default Grab & Go price list." }
  }
}

export async function createGrabAndGoOrder(data: CreateGrabAndGoOrderInput) {
  await ensureGrabAndGoTablesAndSeed()

  try {
    if (!data.items || data.items.length === 0) {
      return { error: "Order pack is empty. Please add items before checkout." }
    }

    const session = await auth()
    const user = session?.user as any
    const cashierName = user?.name || user?.email || "Counter Staff"

    const calculatedTotal = data.items.reduce((sum, i) => sum + i.totalPrice, 0)
    const randSuffix = Math.floor(1000 + Math.random() * 9000)
    const timeDigits = Date.now().toString().slice(-4)
    const orderNumber = `GG-${timeDigits}${randSuffix.toString().slice(-2)}`
    const orderId = `ggo_${crypto.randomBytes(10).toString("hex")}`

    await prisma.$executeRawUnsafe(
      `INSERT INTO "GrabAndGoOrder" (
        "id", "orderNumber", "customerName", "orderType", "paymentMethod", "cashierName", "status", "totalAmount", "notes", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED', $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      orderId,
      orderNumber,
      data.customerName?.trim() || "Walk-in Customer",
      data.orderType || "TAKEAWAY",
      data.paymentMethod || "CASH",
      cashierName,
      calculatedTotal,
      data.notes?.trim() || null
    )

    for (const item of data.items) {
      const orderItemId = `ggoi_${crypto.randomBytes(10).toString("hex")}`
      await prisma.$executeRawUnsafe(
        `INSERT INTO "GrabAndGoOrderItem" (
          "id", "orderId", "itemId", "itemName", "category", "quantity", "unitPrice", "totalPrice", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        orderItemId,
        orderId,
        item.itemId,
        item.name,
        item.category,
        item.quantity,
        item.unitPrice,
        item.totalPrice
      )

      await prisma
        .$executeRawUnsafe(
          `UPDATE "GrabAndGoItem" SET "stock" = GREATEST(0, "stock" - $1), "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
          item.quantity,
          item.itemId
        )
        .catch(() => null)
    }

    revalidatePath("/dashboard/grab-and-go")
    return {
      success: true,
      orderId,
      orderNumber,
    }
  } catch (error: any) {
    console.error("Failed to create Grab & Go order:", error)
    return { error: "Failed to complete Grab & Go order." }
  }
}

export async function getGrabAndGoOrders(options?: { dateFilter?: string; limit?: number }) {
  await ensureGrabAndGoTablesAndSeed()

  const dateBounds = getDateBounds(options?.dateFilter || "today")
  const limit = options?.limit || 200

  let orders: any[] = []
  if (dateBounds) {
    orders = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "GrabAndGoOrder"
       WHERE "createdAt" >= $1 AND "createdAt" <= $2
       ORDER BY "createdAt" DESC
       LIMIT $3`,
      dateBounds.gte,
      dateBounds.lte,
      limit
    )
  } else {
    orders = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "GrabAndGoOrder"
       ORDER BY "createdAt" DESC
       LIMIT $1`,
      limit
    )
  }

  if (!orders || orders.length === 0) return []

  const orderIds = orders.map((o) => o.id)
  const items = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "GrabAndGoOrderItem" WHERE "orderId" = ANY($1::text[]) ORDER BY "createdAt" ASC`,
    orderIds
  )

  const itemsByOrder = new Map<string, any[]>()
  for (const item of items || []) {
    const list = itemsByOrder.get(item.orderId) || []
    list.push({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })
    itemsByOrder.set(item.orderId, list)
  }

  return orders.map((o) => ({
    ...o,
    totalAmount: Number(o.totalAmount),
    items: itemsByOrder.get(o.id) || [],
  }))
}

export async function getGrabAndGoAnalytics(dateFilter: string = "today") {
  const orders = await getGrabAndGoOrders({ dateFilter, limit: 1000 })

  let totalRevenue = 0
  let takeawayRevenue = 0
  let takeawayCount = 0
  let eatInRevenue = 0
  let eatInCount = 0

  let cashRevenue = 0
  let posRevenue = 0
  let transferRevenue = 0

  const itemMap: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {}

  for (const order of orders) {
    totalRevenue += order.totalAmount

    if (order.orderType === "EAT_IN") {
      eatInRevenue += order.totalAmount
      eatInCount++
    } else {
      takeawayRevenue += order.totalAmount
      takeawayCount++
    }

    if (order.paymentMethod === "POS") {
      posRevenue += order.totalAmount
    } else if (order.paymentMethod === "TRANSFER") {
      transferRevenue += order.totalAmount
    } else {
      cashRevenue += order.totalAmount
    }

    for (const item of order.items || []) {
      const key = item.itemName
      if (!itemMap[key]) {
        itemMap[key] = {
          name: item.itemName,
          category: item.category,
          quantity: 0,
          revenue: 0,
        }
      }
      itemMap[key].quantity += item.quantity
      itemMap[key].revenue += item.totalPrice
    }
  }

  const itemsSold = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity)
  const topItems = itemsSold.slice(0, 8)

  return {
    totalRevenue,
    totalOrders: orders.length,
    takeawayRevenue,
    takeawayCount,
    eatInRevenue,
    eatInCount,
    cashRevenue,
    posRevenue,
    transferRevenue,
    itemsSold,
    topItems,
  }
}

export async function addGrabAndGoItem(formData: FormData) {
  if (!(await hasSettingsPermission())) {
    return { error: "Unauthorized. Only Settings / Administrators can modify the price list." }
  }
  await ensureGrabAndGoTablesAndSeed()

  const name = (formData.get("name") as string)?.trim()
  const price = parseFloat(formData.get("price") as string)
  const category = (formData.get("category") as string) || "Rice"
  const stock = parseInt(formData.get("stock") as string, 10) || 500

  if (!name || isNaN(price) || price < 0) {
    return { error: "Please provide a valid item name and price." }
  }

  try {
    const id = `gg_${crypto.randomBytes(8).toString("hex")}`
    await prisma.$executeRawUnsafe(
      `INSERT INTO "GrabAndGoItem" ("id", "name", "price", "category", "isAvailable", "stock", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      id,
      name,
      price,
      category,
      stock
    )
    revalidatePath("/dashboard/grab-and-go")
    revalidatePath("/dashboard/settings/grab-and-go-catalog")
    return { success: true }
  } catch (e: any) {
    return { error: "An item with this name already exists or could not be added." }
  }
}

export async function updateGrabAndGoItem(formData: FormData) {
  if (!(await hasSettingsPermission())) {
    return { error: "Unauthorized. Only Settings / Administrators can modify the price list." }
  }
  await ensureGrabAndGoTablesAndSeed()

  const id = formData.get("id") as string
  const name = (formData.get("name") as string)?.trim()
  const price = parseFloat(formData.get("price") as string)
  const category = (formData.get("category") as string) || "Rice"
  const stock = parseInt(formData.get("stock") as string, 10) || 500
  const isAvailable = formData.get("isAvailable") !== "false"

  if (!id || !name || isNaN(price) || price < 0) {
    return { error: "Please provide valid item details." }
  }

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "GrabAndGoItem"
       SET "name" = $1, "price" = $2, "category" = $3, "stock" = $4, "isAvailable" = $5, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $6`,
      name,
      price,
      category,
      stock,
      isAvailable,
      id
    )
    revalidatePath("/dashboard/grab-and-go")
    revalidatePath("/dashboard/settings/grab-and-go-catalog")
    return { success: true }
  } catch (e: any) {
    return { error: "Failed to update menu item." }
  }
}

export async function deleteGrabAndGoItem(id: string) {
  if (!(await hasSettingsPermission())) {
    return { error: "Unauthorized. Only Settings / Administrators can modify the price list." }
  }
  await ensureGrabAndGoTablesAndSeed()

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "GrabAndGoItem" WHERE "id" = $1`, id)
    revalidatePath("/dashboard/grab-and-go")
    revalidatePath("/dashboard/settings/grab-and-go-catalog")
    return { success: true }
  } catch (e: any) {
    return { error: "Cannot delete an item that has recorded sales history." }
  }
}
