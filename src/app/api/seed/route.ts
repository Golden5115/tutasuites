import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const ROOM_TYPES = [
  {
    name: "Signature Suite",
    slug: "signature-suite",
    description: "Our most luxurious offering with panoramic views and bespoke furnishings. The Signature Suite features a spacious living area, premium king-size bed, marble bathroom with rain shower, and a private balcony overlooking the city skyline.",
    basePrice: 40000,
    capacity: 4,
    bedType: "King Bed",
    size: "65 sqm",
    images: ["/signature.png"],
    facilities: ["King Bed", "City View", "Living Area", "Balcony", "Free WiFi", "Air Conditioning", "Smart TV", "Mini Bar", "Room Service", "Private Bathroom", "Rain Shower", "Work Desk"],
    rules: "No smoking. No pets. Quiet hours from 10 PM to 7 AM.",
    cancellation: "Free cancellation up to 24 hours before check-in. 50% charge for cancellations within 24 hours.",
    rooms: ["105", "106"],
  },
  {
    name: "Executive Suite",
    slug: "executive-suite",
    description: "Perfect for business travelers seeking premium comfort and productivity. Features a dedicated workstation, high-speed internet, and a comfortable lounge area for meetings or relaxation.",
    basePrice: 35000,
    capacity: 2,
    bedType: "Queen Bed",
    size: "50 sqm",
    images: ["/executive.png"],
    facilities: ["Queen Bed", "Workstation", "Lounge", "Mini Bar", "Free WiFi", "Air Conditioning", "Smart TV", "Room Service", "Private Bathroom", "Iron & Board"],
    rules: "No smoking. No pets. Quiet hours from 10 PM to 7 AM.",
    cancellation: "Free cancellation up to 24 hours before check-in. 50% charge for cancellations within 24 hours.",
    rooms: ["102", "103"],
  },
  {
    name: "Premium Suite",
    slug: "premium-suite",
    description: "Elegant and spacious rooms designed for absolute relaxation. The Premium Suite features carefully curated interiors, a luxurious bathtub, and all modern amenities for a memorable stay.",
    basePrice: 30000,
    capacity: 2,
    bedType: "Queen Bed",
    size: "42 sqm",
    images: ["/signature.png"],
    facilities: ["Queen Bed", "Bathtub", "Smart TV", "Room Service", "Free WiFi", "Air Conditioning", "Private Bathroom", "Coffee Maker"],
    rules: "No smoking. No pets. Quiet hours from 10 PM to 7 AM.",
    cancellation: "Free cancellation up to 48 hours before check-in. Full charge for cancellations within 48 hours.",
    rooms: ["101"],
  },
  {
    name: "Classic Suite",
    slug: "classic-suite",
    description: "Comfort meets luxury in our beautifully appointed standard suites. Ideal for couples and solo travelers looking for a cozy retreat with all essential amenities included.",
    basePrice: 25000,
    capacity: 2,
    bedType: "Double Bed",
    size: "35 sqm",
    images: ["/executive.png"],
    facilities: ["Double Bed", "En-suite Bathroom", "Free WiFi", "Breakfast Included", "Air Conditioning", "Smart TV", "Wardrobe"],
    rules: "No smoking. No pets. Quiet hours from 10 PM to 7 AM.",
    cancellation: "Free cancellation up to 48 hours before check-in. Full charge for cancellations within 48 hours.",
    rooms: ["104"],
  },
]

export async function GET() {
  try {
    // Seed admin user
    const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@tutasuites.com" } })
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      await prisma.user.create({
        data: {
          email: "admin@tutasuites.com",
          name: "Admin User",
          password: hashedPassword,
          role: "ADMIN",
          modules: ["RESERVATIONS", "GUESTS", "ROOMS", "SETTINGS", "STAFF"],
        },
      })
    }

    // Seed site settings
    const existingSettings = await prisma.siteSettings.findFirst()
    if (!existingSettings) {
      await prisma.siteSettings.create({ data: {} })
    }

    // Seed room types and rooms
    const existingRoomTypes = await prisma.roomType.findFirst()
    if (!existingRoomTypes) {
      for (const rt of ROOM_TYPES) {
        const roomType = await prisma.roomType.create({
          data: {
            name: rt.name,
            slug: rt.slug,
            description: rt.description,
            basePrice: rt.basePrice,
            capacity: rt.capacity,
            bedType: rt.bedType,
            size: rt.size,
            images: rt.images,
            facilities: rt.facilities,
            rules: rt.rules,
            cancellation: rt.cancellation,
          },
        })

        for (const roomNumber of rt.rooms) {
          await prisma.room.create({
            data: {
              number: roomNumber,
              roomTypeId: roomType.id,
            },
          })
        }
      }
    }

    return NextResponse.json({ message: "Database seeded successfully!" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
}
