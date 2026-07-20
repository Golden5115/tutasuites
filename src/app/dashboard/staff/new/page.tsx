import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CreateStaffForm } from "@/components/create-staff-form"

export default async function NewStaffPage() {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Staff Member</h1>
          <p className="text-muted-foreground">
            Create a new staff account and assign permissions.
          </p>
        </div>
      </div>
      <CreateStaffForm />
    </div>
  )
}
