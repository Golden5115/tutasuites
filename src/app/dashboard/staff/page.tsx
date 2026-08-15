import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StaffStatusToggle } from "@/components/staff-status-toggle"
import { UserPlus, ShieldAlert, CheckCircle2 } from "lucide-react"

export default async function StaffPage() {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard")
  }

  const currentUserId = (session.user as any).id

  const staffList = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage hotel staff accounts, module access, and active credentials.
          </p>
        </div>
        <Link href="/dashboard/staff/new">
          <Button className="gap-2 shadow-sm">
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm border-border/80">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Registered Staff Members</CardTitle>
          <CardDescription>
            Active staff members can log in and access their assigned modules. Suspended accounts are immediately locked out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr className="text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-4">Staff Name & Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Module Permissions</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {staffList.map((staff) => {
                  const isSuspended = staff.isActive === false
                  const isCurrentUser = staff.id === currentUserId

                  return (
                    <tr
                      key={staff.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        isSuspended ? "bg-red-500/[0.02]" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-2">
                            {staff.name}
                            {isCurrentUser && (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{staff.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-secondary-foreground border border-border/50">
                          {staff.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {staff.modules.length > 0 ? (
                            staff.modules.map((module) => (
                              <span
                                key={module}
                                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border"
                              >
                                {module}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No specific modules</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <StaffStatusToggle
                          userId={staff.id}
                          userName={staff.name}
                          isActive={staff.isActive}
                          isCurrentUser={isCurrentUser}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
