export interface DeliveryLocation {
  id: string
  name: string
  zone: "ZONE_1" | "ZONE_2" | "ZONE_3" | "ZONE_4"
  baseRate: number
  estimatedTime: string
  landmarks: string[]
}

export const DELIVERY_LOCATIONS: DeliveryLocation[] = [
  {
    id: "mowe",
    name: "Mowe",
    zone: "ZONE_1",
    baseRate: 1200,
    estimatedTime: "20 - 35 mins",
    landmarks: ["Mowe Bus Stop", "Assurance CDA", "Owonikoko", "Orimerunmu", "Nestle Mowe"],
  },
  {
    id: "owonikoko-orimerunmu",
    name: "Owonikoko / Orimerunmu",
    zone: "ZONE_1",
    baseRate: 1000,
    estimatedTime: "15 - 25 mins",
    landmarks: ["Tuta Suites HQ", "Assurance Estate", "Express Junction"],
  },
  {
    id: "lotto",
    name: "Lotto",
    zone: "ZONE_1",
    baseRate: 1400,
    estimatedTime: "25 - 40 mins",
    landmarks: ["Lotto Bus Stop", "Redeemed Camp Gate 1"],
  },
  {
    id: "asese",
    name: "Asese",
    zone: "ZONE_1",
    baseRate: 1500,
    estimatedTime: "25 - 40 mins",
    landmarks: ["Asese Junction", "Expressway corridor"],
  },
  {
    id: "olowotedo",
    name: "Olowotedo",
    zone: "ZONE_1",
    baseRate: 1500,
    estimatedTime: "25 - 40 mins",
    landmarks: ["Olowotedo Market", "Redeemed Camp Axis"],
  },
  {
    id: "christ-embassy",
    name: "Christ Embassy",
    zone: "ZONE_2",
    baseRate: 1800,
    estimatedTime: "30 - 45 mins",
    landmarks: ["Camp Ground", "Asese Border"],
  },
  {
    id: "ibafo",
    name: "Ibafo",
    zone: "ZONE_2",
    baseRate: 1800,
    estimatedTime: "30 - 45 mins",
    landmarks: ["Ibafo Market", "Express Bus Stop", "Police Station"],
  },
  {
    id: "magboro",
    name: "Magboro",
    zone: "ZONE_2",
    baseRate: 2200,
    estimatedTime: "35 - 50 mins",
    landmarks: ["Magboro Market", "Underbridge", "Gasline"],
  },
  {
    id: "arepo",
    name: "Arepo",
    zone: "ZONE_3",
    baseRate: 2500,
    estimatedTime: "40 - 55 mins",
    landmarks: ["Arepo Junction", "Journalists Estate"],
  },
  {
    id: "wawa",
    name: "Wawa",
    zone: "ZONE_3",
    baseRate: 2800,
    estimatedTime: "45 - 60 mins",
    landmarks: ["Wawa Bus Stop", "Long Bridge Axis"],
  },
  {
    id: "opic",
    name: "OPIC",
    zone: "ZONE_3",
    baseRate: 3000,
    estimatedTime: "45 - 60 mins",
    landmarks: ["OPIC Plaza", "Berger Border", "Riverview Estate"],
  },
  {
    id: "sagamu",
    name: "Sagamu",
    zone: "ZONE_4",
    baseRate: 4500,
    estimatedTime: "50 - 75 mins",
    landmarks: ["Sagamu Interchange", "Remo Axis", "NYSC Camp Road"],
  },
]

export const DELIVERY_SERVICES = [
  {
    id: "document",
    title: "Document Delivery",
    desc: "Urgent contracts, bank tokens, official letters & certificates delivered securely with sign-off.",
    icon: "FileText",
    baseMultiplier: 1.0,
    urgency: "High priority",
  },
  {
    id: "package",
    title: "Package & Parcel",
    desc: "Boxes, parcels, e-commerce orders, clothing, gadgets & electronics handled with care.",
    icon: "Package",
    baseMultiplier: 1.0,
    urgency: "Standard / Express",
  },
  {
    id: "food",
    title: "Food & Meals Delivery",
    desc: "Fresh, hot meals from Tuta Suites Restaurant or your favourite local food spot delivered in insulated packs.",
    icon: "Utensils",
    baseMultiplier: 1.1,
    urgency: "Immediate Express",
  },
  {
    id: "laundry",
    title: "Laundry Pick Up & Delivery",
    desc: "Doorstep pickup and return delivery linked with Tuta Suites professional laundry & dry cleaning.",
    icon: "Shirt",
    baseMultiplier: 1.0,
    urgency: "Scheduled / Same-day",
  },
  {
    id: "shopping",
    title: "Shopping & Errands",
    desc: "Personal runner for supermarket runs, open market shopping, groceries, and hardware items.",
    icon: "ShoppingCart",
    baseMultiplier: 1.2,
    urgency: "Custom Errand",
  },
  {
    id: "pharmacy",
    title: "Pharmacy Pick Up",
    desc: "Urgent medications, baby essentials, and healthcare supplies picked up and delivered discreetly.",
    icon: "Pill",
    baseMultiplier: 1.0,
    urgency: "Urgent / Express",
  },
  {
    id: "gifts",
    title: "Gifts & Surprises",
    desc: "Birthday cakes, floral gifts, hampers, and surprise packages delivered with prompt presentation.",
    icon: "Gift",
    baseMultiplier: 1.15,
    urgency: "Timed Delivery",
  },
  {
    id: "business",
    title: "Business Deliveries",
    desc: "B2B daily dispatch, multi-stop merchant distribution, and scheduled corporate supplies.",
    icon: "Building2",
    baseMultiplier: 1.1,
    urgency: "Scheduled / Fleet",
  },
]

export interface DeliveryRequestData {
  id?: string
  trackingNumber?: string
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
  status?: "PENDING" | "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"
  paymentMethod?: "CASH_ON_DELIVERY" | "BANK_TRANSFER" | "PAYSTACK"
  createdAt?: string
}
