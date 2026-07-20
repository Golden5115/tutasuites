"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Fetch site settings (tax %, service charge %).
 * Creates defaults if none exist yet.
 */
export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findFirst()
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: {} })
  }
  return settings
}

/**
 * Search for available room types for a given date range and guest count.
 * A room type is available if at least one physical room of that type
 * has no overlapping reservation (that isn't cancelled/checked-out).
 */
export async function searchAvailability(
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number
) {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const totalGuests = adults + children

  // Get all room types that can accommodate the guests
  const roomTypes = await prisma.roomType.findMany({
    where: {
      capacity: { gte: totalGuests },
    },
    include: {
      rooms: {
        include: {
          reservations: {
            where: {
              status: { notIn: ["CANCELLED", "CHECKED_OUT", "NO_SHOW"] },
              // Overlapping condition: existing checkIn < requested checkOut AND existing checkOut > requested checkIn
              checkIn: { lt: checkOutDate },
              checkOut: { gt: checkInDate },
            },
          },
        },
      },
    },
    orderBy: { basePrice: "asc" },
  })

  // Filter to only room types that have at least 1 available room
  return roomTypes
    .map((rt) => {
      const availableRooms = rt.rooms.filter(
        (room) => room.reservations.length === 0 && room.status !== "MAINTENANCE"
      )
      return {
        ...rt,
        availableCount: availableRooms.length,
        rooms: undefined, // don't expose room internals
      }
    })
    .filter((rt) => rt.availableCount > 0)
}

/**
 * Create a booking (reservation) for a guest.
 * Finds the first available physical room of the given room type.
 */
export async function createBooking(data: {
  roomTypeSlug: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  specialRequests: string
  extras: { name: string; price: number; quantity: number }[]
}) {
  const checkInDate = new Date(data.checkIn)
  const checkOutDate = new Date(data.checkOut)
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Get room type
  const roomType = await prisma.roomType.findUnique({
    where: { slug: data.roomTypeSlug },
    include: {
      rooms: {
        include: {
          reservations: {
            where: {
              status: { notIn: ["CANCELLED", "CHECKED_OUT", "NO_SHOW"] },
              checkIn: { lt: checkOutDate },
              checkOut: { gt: checkInDate },
            },
          },
        },
      },
    },
  })

  if (!roomType) throw new Error("Room type not found")

  // Find first available room
  const availableRoom = roomType.rooms.find(
    (room) => room.reservations.length === 0 && room.status !== "MAINTENANCE"
  )

  if (!availableRoom) throw new Error("No rooms available for the selected dates")

  // Get pricing settings
  const settings = await getSiteSettings()

  // Calculate pricing
  const roomPrice = roomType.basePrice * nights
  const extrasAmount = data.extras.reduce(
    (sum, e) => sum + e.price * e.quantity,
    0
  )
  const subtotal = roomPrice + extrasAmount
  const taxAmount = (subtotal * settings.taxPercent) / 100
  const serviceCharge = (subtotal * settings.servicePercent) / 100
  const totalAmount = subtotal + taxAmount + serviceCharge

  // Generate booking reference: HTL-YYYYMMDD-XXXX
  const dateStr = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")
  const randomNum = String(Math.floor(1000 + Math.random() * 9000))
  const bookingReference = `HTL-${dateStr}-${randomNum}`

  // Create guest
  const guest = await prisma.guest.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      country: data.country,
      specialRequests: data.specialRequests,
    },
  })

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      guestId: guest.id,
      roomId: availableRoom.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults: data.adults,
      children: data.children,
      numberOfGuests: data.adults + data.children,
      nights,
      status: "PENDING",
      bookingReference,
      roomPrice,
      taxAmount,
      serviceCharge,
      extrasAmount,
      totalAmount,
      paymentStatus: "UNPAID",
      extras: {
        create: data.extras.map((e) => ({
          name: e.name,
          price: e.price,
          quantity: e.quantity,
        })),
      },
    },
  })

  revalidatePath("/dashboard")
  return { bookingReference, reservationId: reservation.id, totalAmount }
}

/**
 * Look up a booking by email and reference.
 */
export async function getBookingByReference(email: string, reference: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { bookingReference: reference },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      payment: true,
      extras: true,
    },
  })

  if (!reservation) return null
  if (reservation.guest.email?.toLowerCase() !== email.toLowerCase()) return null

  return reservation
}

/**
 * Cancel a booking by reference.
 */
export async function cancelBooking(reference: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { bookingReference: reference },
  })

  if (!reservation) throw new Error("Booking not found")
  if (reservation.status === "CHECKED_IN") throw new Error("Cannot cancel a checked-in booking")

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "CANCELLED" },
  })

  // Make the room available again
  await prisma.room.update({
    where: { id: reservation.roomId },
    data: { status: "AVAILABLE" },
  })

  revalidatePath("/dashboard")
  return { success: true }
}
