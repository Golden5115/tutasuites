import { RoomTypeForm } from "@/components/room-type-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function EditRoomTypePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: params.id },
  })

  if (!roomType) {
    redirect("/dashboard/rooms")
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <RoomTypeForm initialData={roomType} />
    </div>
  )
}
