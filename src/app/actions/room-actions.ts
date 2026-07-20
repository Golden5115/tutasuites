"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

// ---------------------------
// ROOM TYPES
// ---------------------------

export async function createRoomType(data: any) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    const roomType = await prisma.roomType.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        basePrice: parseFloat(data.basePrice),
        capacity: parseInt(data.capacity),
        bedType: data.bedType,
        size: data.size,
        images: typeof data.images === "string" ? data.images.split(",").map((i: string) => i.trim()) : data.images,
        facilities: typeof data.facilities === "string" ? data.facilities.split(",").map((i: string) => i.trim()) : data.facilities,
        rules: data.rules,
        cancellation: data.cancellation,
      },
    })
    revalidatePath("/dashboard/rooms")
    revalidatePath("/rooms")
    return { success: true, roomType }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Failed to create room type" }
  }
}

export async function updateRoomType(id: string, data: any) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    const roomType = await prisma.roomType.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        basePrice: parseFloat(data.basePrice),
        capacity: parseInt(data.capacity),
        bedType: data.bedType,
        size: data.size,
        images: typeof data.images === "string" ? data.images.split(",").map((i: string) => i.trim()) : data.images,
        facilities: typeof data.facilities === "string" ? data.facilities.split(",").map((i: string) => i.trim()) : data.facilities,
        rules: data.rules,
        cancellation: data.cancellation,
      },
    })
    revalidatePath("/dashboard/rooms")
    revalidatePath(`/rooms/${roomType.slug}`)
    revalidatePath("/rooms")
    return { success: true, roomType }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Failed to update room type" }
  }
}

export async function deleteRoomType(id: string) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.roomType.delete({
      where: { id },
    })
    revalidatePath("/dashboard/rooms")
    revalidatePath("/rooms")
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: "Failed to delete room type. Ensure there are no physical rooms or reservations attached to it." }
  }
}

// ---------------------------
// PHYSICAL ROOMS
// ---------------------------

export async function addPhysicalRoom(roomTypeId: string, roomNumber: string) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    const room = await prisma.room.create({
      data: {
        number: roomNumber,
        roomTypeId,
        status: "AVAILABLE",
      },
    })
    revalidatePath(`/dashboard/rooms/${roomTypeId}/instances`)
    return { success: true, room }
  } catch (error: any) {
    console.error(error)
    return { error: "Failed to add physical room. Room number may already exist." }
  }
}

export async function deletePhysicalRoom(id: string, roomTypeId: string) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.room.delete({
      where: { id },
    })
    revalidatePath(`/dashboard/rooms/${roomTypeId}/instances`)
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: "Failed to delete room. Ensure there are no active reservations attached to it." }
  }
}
