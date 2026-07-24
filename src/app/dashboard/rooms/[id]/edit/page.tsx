import { RoomTypeForm } from "@/components/room-type-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function EditRoomTypePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params;

  const roomType = await prisma.roomType.findUnique({
    where: { id },
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
