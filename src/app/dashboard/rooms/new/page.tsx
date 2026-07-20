import { RoomTypeForm } from "@/components/room-type-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function NewRoomTypePage() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <RoomTypeForm />
    </div>
  )
}
