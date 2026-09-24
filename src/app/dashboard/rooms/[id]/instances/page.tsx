import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { InstancesClient } from "./instances-client"

export default async function PhysicalRoomsPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: params.id },
    include: {
      rooms: {
        orderBy: {
          number: 'asc'
        }
      }
    }
  })

  if (!roomType) {
    redirect("/dashboard/rooms")
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <InstancesClient roomType={roomType} />
    </div>
  )
}
