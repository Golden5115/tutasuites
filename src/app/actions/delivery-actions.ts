"use server"

import fs from "fs"
import path from "path"

import { 
  DELIVERY_LOCATIONS, 
  DELIVERY_SERVICES, 
  DeliveryLocation, 
  DeliveryRequestData 
} from "@/lib/delivery-constants"

// Memory store fallback
const memoryOrders: DeliveryRequestData[] = [
  {
    id: "mock-1",
    trackingNumber: "TUTA-DEL-892401",
    senderName: "Tuta Kitchen",
    senderPhone: "07075733866",
    senderAddress: "Tuta Suites, No 3 Assurance CDA, Orimerunmu",
    senderArea: "Mowe",
    recipientName: "Dr. Abiola K.",
    recipientPhone: "08031234567",
    recipientAddress: "Journalists Estate, Arepo",
    recipientArea: "Arepo",
    serviceType: "food",
    packageSize: "MEDIUM",
    itemDescription: "Chef's Special Jollof Rice & Grilled Fish platter",
    deliveryNotes: "Deliver hot, call on arrival at gate.",
    estimatedAmount: 2800,
    status: "IN_TRANSIT",
    paymentMethod: "BANK_TRANSFER",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-2",
    trackingNumber: "TUTA-DEL-741902",
    senderName: "Grace O.",
    senderPhone: "09087654321",
    senderAddress: "Magboro Market Junction",
    senderArea: "Magboro",
    recipientName: "Boluwatife S.",
    recipientPhone: "07011223344",
    recipientAddress: "Olowotedo Estate Gate 2",
    recipientArea: "Olowotedo",
    serviceType: "package",
    packageSize: "SMALL",
    itemDescription: "Fashion boutique parcel (clothing)",
    deliveryNotes: "Fragile packaging",
    estimatedAmount: 1900,
    status: "DELIVERED",
    paymentMethod: "CASH_ON_DELIVERY",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
]

const ORDERS_DIR = path.join(process.cwd(), ".delivery-orders")
const ORDERS_FILE = path.join(ORDERS_DIR, "orders.json")

function loadStoredOrders(): DeliveryRequestData[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      return memoryOrders
    }
    const data = fs.readFileSync(ORDERS_FILE, "utf-8")
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed)) {
      return [...parsed, ...memoryOrders.filter(m => !parsed.some((p: DeliveryRequestData) => p.trackingNumber === m.trackingNumber))]
    }
  } catch (e) {
    console.warn("Could not read orders file, using memory fallback", e)
  }
  return memoryOrders
}

function saveStoredOrders(orders: DeliveryRequestData[]) {
  try {
    if (!fs.existsSync(ORDERS_DIR)) {
      fs.mkdirSync(ORDERS_DIR, { recursive: true })
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8")
  } catch (e) {
    console.warn("Could not save to orders file, keeping in memory", e)
  }
}

/**
 * Calculates delivery rate based on origin, destination, service and weight
 */
export async function calculateDeliveryEstimate(
  originId: string,
  destinationId: string,
  serviceId: string,
  packageSize: "SMALL" | "MEDIUM" | "LARGE" | "BULK" = "MEDIUM"
) {
  const origin = DELIVERY_LOCATIONS.find((l) => l.id === originId) || DELIVERY_LOCATIONS[0]
  const destination = DELIVERY_LOCATIONS.find((l) => l.id === destinationId) || DELIVERY_LOCATIONS[1]
  const service = DELIVERY_SERVICES.find((s) => s.id === serviceId) || DELIVERY_SERVICES[1]

  // Base rate logic based on locations
  const maxBase = Math.max(origin.baseRate, destination.baseRate)
  const isSameZone = origin.zone === destination.zone
  
  let rate = isSameZone ? maxBase : Math.round(maxBase * 1.25)

  // Service multiplier
  rate = Math.round(rate * service.baseMultiplier)

  // Size adjustment
  if (packageSize === "SMALL") rate = Math.round(rate * 0.9)
  if (packageSize === "LARGE") rate = Math.round(rate * 1.3)
  if (packageSize === "BULK") rate = Math.round(rate * 1.6)

  // Round to nearest 50
  rate = Math.round(rate / 50) * 50

  return {
    origin: origin.name,
    destination: destination.name,
    service: service.title,
    packageSize,
    rate,
    currency: "NGN",
    estimatedTime: destination.estimatedTime,
    originLandmarks: origin.landmarks,
    destinationLandmarks: destination.landmarks,
  }
}

/**
 * Creates and registers a new delivery booking
 */
export async function createDeliveryRequest(formData: {
  senderName: string
  senderPhone: string
  senderAddress: string
  senderArea: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientArea: string
  serviceType: string
  packageSize?: string
  itemDescription: string
  deliveryNotes?: string
  estimatedAmount: number
  paymentMethod?: "CASH_ON_DELIVERY" | "BANK_TRANSFER" | "PAYSTACK"
}) {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000)
  const trackingNumber = `TUTA-DEL-${randomSuffix}`

  const newOrder: DeliveryRequestData = {
    id: `del-${Date.now()}`,
    trackingNumber,
    ...formData,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  }

  const existing = loadStoredOrders()
  const updated = [newOrder, ...existing]
  saveStoredOrders(updated)

  // Generate WhatsApp Direct URL
  const hotline = "2347075733866"
  const serviceName = DELIVERY_SERVICES.find(s => s.id === formData.serviceType)?.title || formData.serviceType
  const message = `Hello Tuta Courier Service!%0A%0A📦 *NEW DELIVERY BOOKING*%0A*Tracking ID:* ${trackingNumber}%0A*Service:* ${serviceName}%0A*Estimated Fare:* ₦${formData.estimatedAmount.toLocaleString()}%0A%0A*PICKUP LOCATION:*%0A${formData.senderName} (${formData.senderPhone})%0A${formData.senderAddress}, ${formData.senderArea}%0A%0A*DROP-OFF LOCATION:*%0A${formData.recipientName} (${formData.recipientPhone})%0A${formData.recipientAddress}, ${formData.recipientArea}%0A%0A*Item:* ${formData.itemDescription}%0A*Notes:* ${formData.deliveryNotes || "None"}%0A%0APlease assign a dispatch rider. Thank you!`

  const whatsAppUrl = `https://wa.me/${hotline}?text=${message}`

  return {
    success: true,
    trackingNumber,
    order: newOrder,
    whatsAppUrl,
  }
}

/**
 * Look up delivery status by tracking code
 */
export async function trackDeliveryOrder(trackingNumber: string) {
  const normalized = trackingNumber.trim().toUpperCase()
  const orders = loadStoredOrders()
  const order = orders.find(
    (o) => o.trackingNumber?.toUpperCase() === normalized || o.id === normalized
  )

  if (!order) {
    return {
      found: false,
      message: `No delivery record found with tracking number "${trackingNumber}". Please check the number or contact dispatch at 07075733866.`,
    }
  }

  // Derive timeline steps based on status
  const steps = [
    { title: "Booking Received", desc: "Order logged into Tuta Courier system", done: true, time: "Initial" },
    {
      title: "Dispatcher Assigned",
      desc: "Local dispatch rider allocated to pickup",
      done: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(order.status || ""),
      time: "Step 2",
    },
    {
      title: "Package Picked Up",
      desc: `Collected from ${order.senderArea}`,
      done: ["PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(order.status || ""),
      time: "Step 3",
    },
    {
      title: "In Transit",
      desc: `En route to ${order.recipientArea}`,
      done: ["IN_TRANSIT", "DELIVERED"].includes(order.status || ""),
      time: "Step 4",
    },
    {
      title: "Delivered",
      desc: `Safely handed over to ${order.recipientName}`,
      done: order.status === "DELIVERED",
      time: "Final",
    },
  ]

  return {
    found: true,
    order,
    steps,
  }
}
