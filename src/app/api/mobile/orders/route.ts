import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

const DATA_DIR = path.join(process.cwd(), ".delivery-orders")
const ORDERS_FILE = path.join(DATA_DIR, "mobile-orders.json")

function getOrders(): any[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return []
    const raw = fs.readFileSync(ORDERS_FILE, "utf-8")
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

function saveOrders(orders: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8")
  } catch (e) {
    console.warn("Could not write mobile orders file", e)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function GET() {
  const orders = getOrders()
  return NextResponse.json(
    {
      success: true,
      orders,
    },
    { headers: CORS_HEADERS }
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      type = "GRAB_AND_GO",
      items = [],
      customerName = "Mobile Customer",
      customerPhone = "",
      deliveryAddress = "",
      deliveryArea = "Mowe",
      notes = "",
      paymentMethod = "TRANSFER",
      subtotal = 0,
      deliveryFee = 0,
      serviceFee = 0,
      totalAmount: explicitTotal,
      orderType = "TAKEAWAY",
    } = body

    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const trackingId = body.trackingId || `TGG-${randomDigits}`
    const totalAmount = explicitTotal || subtotal + deliveryFee + serviceFee

    const estimatedMinutes = orderType === "PICKUP" || orderType === "TAKEAWAY" ? 10 : 25
    const estimatedArrival = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString()

    const rider = {
      name: "Babatunde K.",
      phone: "07075733866",
      vehicle: "Bajaj Boxer 150",
      plateNumber: "OGN-842-KT",
      rating: 4.9,
      deliveriesCount: 184,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    }

    const newOrder = {
      id: trackingId,
      trackingId,
      type,
      orderType,
      items,
      customerName,
      customerPhone,
      deliveryAddress: deliveryAddress || (orderType === "PICKUP" ? "Tuta Grab & Go Express Counter" : "Mowe"),
      deliveryArea,
      deliveryNotes: notes,
      paymentMethod,
      subtotal,
      deliveryFee,
      serviceFee,
      totalAmount,
      estimatedMinutes,
      estimatedArrival,
      status: "PREPARING",
      rider,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save to local file cache
    const currentOrders = getOrders()
    saveOrders([newOrder, ...currentOrders])

    // Save directly into GrabAndGoOrder PostgreSQL database if available
    try {
      const orderId = `ggo_${crypto.randomBytes(10).toString("hex")}`
      const contactNote = [
        customerPhone ? `Phone: ${customerPhone}` : "",
        deliveryAddress ? `Address: ${deliveryAddress}` : "",
        notes ? `Note: ${notes}` : "",
      ]
        .filter(Boolean)
        .join(" | ")

      await prisma.$executeRawUnsafe(
        `INSERT INTO "GrabAndGoOrder" (
          "id", "orderNumber", "customerName", "orderType", "paymentMethod", "cashierName", "status", "totalAmount", "notes", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, 'Mobile App', 'PENDING', $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        orderId,
        trackingId,
        customerName.trim() || "Mobile Customer",
        orderType === "PICKUP" || orderType === "TAKEAWAY" ? "TAKEAWAY" : "DELIVERY",
        paymentMethod || "TRANSFER",
        totalAmount,
        contactNote || null
      )

      if (items && Array.isArray(items)) {
        for (const it of items) {
          const orderItemId = `ggoi_${crypto.randomBytes(10).toString("hex")}`
          await prisma.$executeRawUnsafe(
            `INSERT INTO "GrabAndGoOrderItem" (
              "id", "orderId", "itemId", "itemName", "category", "quantity", "unitPrice", "totalPrice", "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
            orderItemId,
            orderId,
            it.itemId || `item_${Date.now()}`,
            it.name || "Meal Portion",
            it.category || "Rice",
            it.quantity || 1,
            it.unitPrice || it.price || (it.totalPrice ? it.totalPrice / (it.quantity || 1) : 500),
            it.totalPrice || ((it.unitPrice || 500) * (it.quantity || 1))
          )
        }
      }
    } catch (dbErr) {
      console.warn("Notice: Database direct write bypassed (file cache retained):", dbErr)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully!",
        order: newOrder,
      },
      { headers: CORS_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400, headers: CORS_HEADERS }
    )
  }
}
