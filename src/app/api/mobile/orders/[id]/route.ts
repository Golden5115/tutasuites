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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orders = getOrders()
  const order = orders.find((o) => o.id === id || o.trackingId === id)

  if (!order) {
    // Generate simulated dynamic order if testing
    const rider = {
      name: "Babatunde K.",
      phone: "07075733866",
      vehicle: "Bajaj Boxer 150",
      plateNumber: "OGN-842-KT",
      rating: 4.9,
      deliveriesCount: 184,
    }

    return NextResponse.json({
      success: true,
      order: {
        id,
        trackingId: id,
        type: "MEAL",
        items: [{ name: "Jollof Rice & Plantain", quantity: 1, price: 2500 }],
        customerName: "Guest Customer",
        customerPhone: "08012345678",
        deliveryAddress: "Assurance CDA Estate, Mowe",
        deliveryArea: "Mowe",
        subtotal: 2500,
        deliveryFee: 1200,
        serviceFee: 200,
        totalAmount: 3900,
        status: "IN_TRANSIT",
        remainingMinutes: 14,
        estimatedMinutes: 30,
        rider,
        milestones: [
          { key: "PLACED", title: "Order Confirmed", desc: "Tuta Kitchen accepted your order", done: true, time: "10:15 AM" },
          { key: "PREPARING", title: "Preparing your Meal", desc: "Chef is packing hot in insulated box", done: true, time: "10:22 AM" },
          { key: "RIDER_PICKED", title: "Rider Picked Up", desc: "Rider collected order from Tuta Suites", done: true, time: "10:31 AM" },
          { key: "IN_TRANSIT", title: "On The Way to You", desc: "Babatunde is en route on Mowe expressway", done: true, current: true, time: "10:34 AM" },
          { key: "DELIVERED", title: "Delivered", desc: "Package handed over safely", done: false, time: "~10:48 AM" },
        ],
      },
    })
  }

  // Calculate dynamic status progression based on elapsed time
  const elapsedMs = Date.now() - new Date(order.createdAt).getTime()
  const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000))
  const totalDuration = order.estimatedMinutes || 30

  let currentStatus = "PLACED"
  if (elapsedMinutes >= 2 && elapsedMinutes < 8) currentStatus = "PREPARING"
  else if (elapsedMinutes >= 8 && elapsedMinutes < 14) currentStatus = "RIDER_PICKED"
  else if (elapsedMinutes >= 14 && elapsedMinutes < totalDuration) currentStatus = "IN_TRANSIT"
  else if (elapsedMinutes >= totalDuration) currentStatus = "DELIVERED"

  const remainingMinutes = Math.max(0, totalDuration - elapsedMinutes)

  const milestones = [
    {
      key: "PLACED",
      title: "Order Placed",
      desc: "Order confirmed and sent to Tuta dispatch",
      done: true,
      time: new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    {
      key: "PREPARING",
      title: order.type === "MEAL" ? "Preparing Meal" : "Processing Package",
      desc: order.type === "MEAL" ? "Kitchen is cooking fresh" : "Dispatcher inspecting package details",
      done: ["PREPARING", "RIDER_PICKED", "IN_TRANSIT", "DELIVERED"].includes(currentStatus),
      current: currentStatus === "PREPARING",
      time: "+3 mins",
    },
    {
      key: "RIDER_PICKED",
      title: "Rider Picked Up",
      desc: `Rider ${order.rider?.name || "Babatunde"} picked up from Tuta Suites HQ`,
      done: ["RIDER_PICKED", "IN_TRANSIT", "DELIVERED"].includes(currentStatus),
      current: currentStatus === "RIDER_PICKED",
      time: "+10 mins",
    },
    {
      key: "IN_TRANSIT",
      title: "Heading to Your Location",
      desc: `Rider is on the road to ${order.deliveryArea}`,
      done: ["IN_TRANSIT", "DELIVERED"].includes(currentStatus),
      current: currentStatus === "IN_TRANSIT",
      time: `ETA ${remainingMinutes} mins`,
    },
    {
      key: "DELIVERED",
      title: "Delivered",
      desc: `Safely arrived at ${order.deliveryAddress}`,
      done: currentStatus === "DELIVERED",
      current: currentStatus === "DELIVERED",
      time: "Final",
    },
  ]

  return NextResponse.json({
    success: true,
    order: {
      ...order,
      status: currentStatus,
      remainingMinutes,
      milestones,
    },
  })
}
