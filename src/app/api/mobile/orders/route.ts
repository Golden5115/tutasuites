import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

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

export async function GET() {
  const orders = getOrders()
  return NextResponse.json({
    success: true,
    orders,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      type = "MEAL", // "MEAL" or "COURIER"
      items = [],
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryArea = "Mowe",
      deliveryNotes = "",
      paymentMethod = "TRANSFER",
      subtotal = 0,
      deliveryFee = 1200,
      serviceFee = 200,
    } = body

    const randomDigits = Math.floor(100000 + Math.random() * 900000)
    const trackingId = `TUTA-ORD-${randomDigits}`
    const totalAmount = subtotal + deliveryFee + serviceFee

    // Calculate Estimated Delivery Time (between 25 and 45 mins based on area)
    const transitMins = deliveryArea.toLowerCase().includes("sagamu") ? 55 : deliveryArea.toLowerCase().includes("opic") ? 45 : 30
    const estimatedMinutes = transitMins
    const estimatedArrival = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString()

    // Assign standard simulated dispatch rider
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
      items,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryArea,
      deliveryNotes,
      paymentMethod,
      subtotal,
      deliveryFee,
      serviceFee,
      totalAmount,
      estimatedMinutes,
      estimatedArrival,
      status: "PREPARING", // PLACED -> PREPARING -> RIDER_PICKED -> IN_TRANSIT -> DELIVERED
      rider,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const currentOrders = getOrders()
    saveOrders([newOrder, ...currentOrders])

    return NextResponse.json({
      success: true,
      message: "Order placed successfully!",
      order: newOrder,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
