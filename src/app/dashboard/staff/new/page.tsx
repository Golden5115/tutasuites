import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CreateStaffForm } from "@/components/create-staff-form"
import Link from "next/link"
import { ChevronRight, UserPlus } from "lucide-react"

export const metadata = {
  title: "Add Staff Member - Tuta Suites",
  description: "Create a new hotel staff account and assign module permissions",
}

export default async function NewStaffPage() {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard")
  }

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
          <span className="text-foreground font-semibold">New Staff</span>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add Staff Member</h1>
            <p className="text-sm text-muted-foreground">
              Create a new employee account, choose their role, and assign operational module permissions.
            </p>
          </div>
        </div>
      </div>

      <CreateStaffForm />
    </div>
  )
}
