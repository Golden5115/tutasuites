"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getAvailableRooms() {
  return await prisma.room.findMany({
    where: { status: "AVAILABLE" },
    include: { roomType: true },
    orderBy: { number: 'asc' }
  })
}

export async function getOccupiedRooms() {
  return await prisma.room.findMany({
    where: { status: "OCCUPIED" },
    include: {
      roomType: true,
      reservations: {
        where: { status: "CHECKED_IN" },
        include: { guest: true },
        take: 1
      }
    },
    orderBy: { number: 'asc' }
  })
}

export async function checkInGuest(formData: FormData) {
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const roomIds = formData.getAll("roomIds") as string[]
  const numberOfGuests = parseInt(formData.get("numberOfGuests") as string, 10) || 1
  const valuableAssets = formData.get("valuableAssets") as string
  const totalAmount = parseFloat(formData.get("totalAmount") as string) || 0

  if (!roomIds || roomIds.length === 0) {
    throw new Error("No rooms selected")
  }

  // Create Guest
  const guest = await prisma.guest.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      address,
    }
  })

  // Generate a booking reference
  const bookingReference = `BKG-${Math.floor(1000 + Math.random() * 9000)}`

  // Fetch the rooms to get their actual prices
  const rooms = await prisma.room.findMany({
    where: { id: { in: roomIds } },
    include: { roomType: true }
  })

  const checkInDate = new Date()
  const checkOutDate = new Date(checkInDate)
  
  if (checkInDate.getHours() < 6) {
    // If between 12 AM and 5:59 AM, due time is 12 PM same day
    checkOutDate.setHours(12, 0, 0, 0)
  } else {
    // Otherwise, due time is 12 PM the next day
    checkOutDate.setDate(checkOutDate.getDate() + 1)
    checkOutDate.setHours(12, 0, 0, 0)
  }

  for (const roomId of roomIds) {
    const room = rooms.find((r: any) => r.id === roomId)
    const roomPrice = room?.roomType?.basePrice || 0

    await prisma.reservation.create({
      data: {
        guestId: guest.id,
        roomId: roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        numberOfGuests,
        valuableAssets,
        status: "CHECKED_IN",
        bookingReference,
        totalAmount: roomPrice,
      }
    })

    await prisma.room.update({
      where: { id: roomId },
      data: { status: "OCCUPIED" }
    })
  }

  revalidatePath("/")
  revalidatePath("/reservations")
  return { success: true }
}

export async function extendStay(formData: FormData) {
  const reservationId = formData.get("reservationId") as string
  const extraDays = parseInt(formData.get("extraDays") as string, 10) || 0
  const additionalAmount = parseFloat(formData.get("additionalAmount") as string) || 0

  if (!reservationId) return { success: false }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId }
  })

  if (!reservation) return { success: false }

  const currentCheckOut = new Date(reservation.checkOut)
  const newCheckOut = new Date(currentCheckOut.getTime() + extraDays * 24 * 60 * 60 * 1000)

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      checkOut: newCheckOut,
      totalAmount: reservation.totalAmount + additionalAmount
    }
  })

  revalidatePath("/")
  revalidatePath("/reservations")
  return { success: true }
}

export async function checkOutGuest(roomId: string, reservationId: string) {
  // Update Reservation
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { 
      status: "CHECKED_OUT",
      actualCheckOut: new Date()
    }
  })

  // Update Room Status to AVAILABLE
  await prisma.room.update({
    where: { id: roomId },
    data: { status: "AVAILABLE" }
  })

  revalidatePath("/")
  revalidatePath("/reservations")
  return { success: true }
}
