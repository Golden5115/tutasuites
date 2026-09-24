"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addRoomCharge(reservationId: string, name: string, price: number, quantity: number = 1) {
  try {
    const totalCharge = price * quantity

    // Create the extra charge record
    await prisma.bookingExtra.create({
      data: {
        reservationId,
        name,
        price,
        quantity
      }
    })

    // Update the reservation totals
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        extrasAmount: { increment: totalCharge },
        totalAmount: { increment: totalCharge }
      }
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to add room charge:", error)
    return { error: "Failed to add room charge." }
  }
}
