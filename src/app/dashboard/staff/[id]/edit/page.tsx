import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EditStaffForm } from "@/components/edit-staff-form"
import Link from "next/link"
import { ChevronRight, UserCog } from "lucide-react"

interface EditStaffPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Staff Account - Tuta Suites",
  description: "Update staff member role, credentials, and module permissions",
}

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params

  const staff = await prisma.user.findUnique({
    where: { id },
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

  if (!staff) {
    redirect("/dashboard/staff")
  }

  const currentUserId = (session.user as any).id
  const isCurrentUser = currentUserId === staff.id

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Link href="/dashboard/staff" className="hover:text-foreground transition-colors">
            Staff Management
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-foreground font-semibold">Edit {staff.name}</span>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Edit Staff Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Modify role, credentials, login access, and module permissions for{" "}
              <strong className="text-foreground">{staff.name}</strong>.
            </p>
          </div>
        </div>
      </div>

      <EditStaffForm staff={staff} isCurrentUser={isCurrentUser} />
    </div>
  )
}
