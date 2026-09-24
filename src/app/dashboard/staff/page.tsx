import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StaffManagementClient } from "@/components/staff-management-client"

export const metadata = {
  title: "Staff Management - Tuta Suites",
  description: "Manage hotel staff accounts, roles, credentials, and module permissions",
}

export default async function StaffPage() {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard")
  }

  const currentUserId = (session.user as any).id

  const staffList = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      modules: true,
      isActive: true,
      createdAt: true,
    },
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Staff Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage team member accounts, assign roles, configure accessible modules, and maintain active credentials.
        </p>
      </div>

      <StaffManagementClient
        initialStaff={staffList}
        currentUserId={currentUserId}
      />
    </div>
  )
}
