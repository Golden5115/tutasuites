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

export async function getCleaningRooms() {
  return await prisma.room.findMany({
    where: { status: "CLEANING" },
    include: { roomType: true },
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

  // Fetch the rooms to get their actual prices
  const rooms = await prisma.room.findMany({
    where: { id: { in: roomIds } },
    include: { roomType: true }
  })

  const checkInDate = new Date()
  let checkOutDate: Date
  
  const manualCheckOut = formData.get("checkOutDate") as string
  if (manualCheckOut) {
    checkOutDate = new Date(manualCheckOut)
  } else {
    checkOutDate = new Date(checkInDate)
    if (checkInDate.getHours() < 6) {
      checkOutDate.setHours(12, 0, 0, 0)
    } else {
      checkOutDate.setDate(checkOutDate.getDate() + 1)
      checkOutDate.setHours(12, 0, 0, 0)
    }
  }

  const rawTotalAmount = formData.get("totalAmount") as string
  const customTotalAmount = rawTotalAmount ? parseFloat(rawTotalAmount) : null
  const customAmountPerRoom = customTotalAmount !== null && roomIds.length > 0 ? customTotalAmount / roomIds.length : null

  for (const roomId of roomIds) {
    const room = rooms.find((r: any) => r.id === roomId)
    const roomPrice = room?.roomType?.basePrice || 0

    const finalRoomPrice = customAmountPerRoom !== null ? customAmountPerRoom : roomPrice

    // Generate a unique booking reference for each room reservation
    const bookingReference = `BKG-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`

    const newReservation = await prisma.reservation.create({
      data: {
        guestId: guest.id,
        roomId: roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        numberOfGuests,
        valuableAssets,
        status: "CHECKED_IN",
        bookingReference,
        totalAmount: finalRoomPrice,
      }
    })

    await prisma.room.update({
      where: { id: roomId },
      data: { status: "OCCUPIED" }
    })
    
    // Fire off confirmation email in background (no await to avoid blocking)
    import("@/lib/email").then((module) => {
      module.sendBookingConfirmation(newReservation.id)
    })
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/reservations")
  return { success: true }
}

export async function extendStay(formData: FormData) {
  const reservationId = formData.get("reservationId") as string
  const extraCount = parseInt(formData.get("extraCount") as string, 10) || 0
  const additionalAmount = parseFloat(formData.get("additionalAmount") as string) || 0

  if (!reservationId || extraCount <= 0) return { success: false }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId }
  })

  if (!reservation) return { success: false }

  const currentCheckOut = new Date(reservation.checkOut)
  let newCheckOut: Date;

  if (reservation.bookingType === "HOURLY") {
    // Add hours
    newCheckOut = new Date(currentCheckOut.getTime() + extraCount * 60 * 60 * 1000)
  } else {
    // Add days
    newCheckOut = new Date(currentCheckOut.getTime() + extraCount * 24 * 60 * 60 * 1000)
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      checkOut: newCheckOut,
      totalAmount: reservation.totalAmount + additionalAmount
    }
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/reservations")
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

  // Update Room Status to CLEANING instead of AVAILABLE
  await prisma.room.update({
    where: { id: roomId },
    data: { status: "CLEANING" }
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/reservations")
  revalidatePath("/dashboard/housekeeping")
  return { success: true }
}

export async function markRoomAsClean(roomId: string) {
  await prisma.room.update({
    where: { id: roomId },
    data: { status: "AVAILABLE" }
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/housekeeping")
  return { success: true }
}
