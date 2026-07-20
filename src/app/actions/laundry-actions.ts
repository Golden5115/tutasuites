"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Catalog Actions
export async function getLaundryCatalog() {
  return prisma.laundryCatalogItem.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function addCatalogItem(formData: FormData) {
  const name = formData.get("name") as string
  const price = parseFloat(formData.get("price") as string)

  if (!name || isNaN(price)) {
    return { error: "Invalid input" }
  }

  await prisma.laundryCatalogItem.create({
    data: { name, price }
  })

  revalidatePath("/dashboard/laundry/catalog")
  revalidatePath("/dashboard/laundry/new")
  return { success: true }
}

export async function deleteCatalogItem(id: string) {
  await prisma.laundryCatalogItem.delete({
    where: { id }
  })

  revalidatePath("/dashboard/laundry/catalog")
  revalidatePath("/dashboard/laundry/new")
}

// Request Actions
export async function getLaundryRequests() {
  return prisma.laundryRequest.findMany({
    include: {
      items: {
        include: {
          catalogItem: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createLaundryRequest(data: {
  customerName: string
  roomNumber?: string
  items: { catalogItemId: string; quantity: number }[]
}) {
  try {
    const catalog = await prisma.laundryCatalogItem.findMany()
    const catalogMap = new Map(catalog.map(i => [i.id, i.price]))

    let totalAmount = 0
    const requestItems = data.items.map(item => {
      const unitPrice = catalogMap.get(item.catalogItemId) || 0
      const totalPrice = unitPrice * item.quantity
      totalAmount += totalPrice

      return {
        catalogItemId: item.catalogItemId,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      }
    })

    await prisma.laundryRequest.create({
      data: {
        customerName: data.customerName,
        roomNumber: data.roomNumber,
        totalAmount,
        items: {
          create: requestItems
        }
      }
    })

    revalidatePath("/dashboard/laundry")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateLaundryStatus(id: string, status: string) {
  await prisma.laundryRequest.update({
    where: { id },
    data: { status }
  })
  revalidatePath("/dashboard/laundry")
}

export async function markLaundryAsPaid(id: string) {
  await prisma.laundryRequest.update({
    where: { id },
    data: { paymentStatus: "PAID" }
  })
  revalidatePath("/dashboard/laundry")
}

export async function getLaundryRequestById(id: string) {
  return prisma.laundryRequest.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          catalogItem: true
        }
      }
    }
  })
}
