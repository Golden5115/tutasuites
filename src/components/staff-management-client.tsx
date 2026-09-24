"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { StaffStatusToggle } from "@/components/staff-status-toggle"
import { DeleteStaffDialog } from "@/components/delete-staff-dialog"
import { SYSTEM_MODULES } from "@/lib/staff-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Pencil, 
  CheckCircle2, 
  ShieldAlert, 
  Shield, 
  UserCheck, 
  Filter,
  Sparkles
} from "lucide-react"

export interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  modules: string[]
  isActive: boolean
  createdAt: Date | string
}

interface StaffManagementClientProps {
  initialStaff: StaffMember[]
  currentUserId: string
}

export function StaffManagementClient({
  initialStaff,
  currentUserId,
}: StaffManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Map module keys to readable short labels
  const moduleMap = useMemo(() => {
    const map = new Map<string, string>()
    SYSTEM_MODULES.forEach((m) => map.set(m.key, m.shortLabel))
    return map
  }, [])

  // Metrics
  const metrics = useMemo(() => {
    const total = initialStaff.length
    const active = initialStaff.filter((s) => s.isActive).length
    const admins = initialStaff.filter((s) => s.role === "ADMIN").length
    const suspended = total - active
    return { total, active, admins, suspended }
  }, [initialStaff])

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return initialStaff.filter((staff) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        staff.name.toLowerCase().includes(q) ||
        staff.email.toLowerCase().includes(q) ||
        staff.role.toLowerCase().includes(q)

      const matchesRole = roleFilter === "ALL" || staff.role === roleFilter
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && staff.isActive) ||
        (statusFilter === "SUSPENDED" && !staff.isActive)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [initialStaff, searchQuery, roleFilter, statusFilter])

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Staff
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{metrics.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Accounts
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.active}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Administrators
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {metrics.admins}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Suspended
            </p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {metrics.suspended}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="pl-9 h-9 sm:h-10 text-sm bg-background border-border/70 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs">
            <span className="text-muted-foreground px-2 flex items-center gap-1 font-medium hidden md:inline-flex">
              <Filter className="w-3 h-3" /> Role:
            </span>
            {(["ALL", "ADMIN", "FRONT_DESK"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  roleFilter === r
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "ALL" ? "All" : r === "ADMIN" ? "Admin" : "Front Desk"}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 text-xs">
            {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === s
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "All" : s === "ACTIVE" ? "Active" : "Suspended"}
              </button>
            ))}
          </div>

          <Link href="/dashboard/staff/new" className="ml-auto sm:ml-0">
            <Button size="sm" className="h-9 sm:h-10 gap-2 rounded-xl shadow-xs">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Staff</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Staff List View */}
      {filteredStaff.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-foreground text-base">No staff members found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No staff account matches "${searchQuery}". Try clearing filters or refining your search.`
              : "No staff members match the selected criteria."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-border/80 overflow-hidden bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr className="text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Module Permissions</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStaff.map((staff) => {
                  const isSuspended = !staff.isActive
                  const isCurrentUser = staff.id === currentUserId

                  // Initials
                  const initials = staff.name
                    ? staff.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "ST"

                  return (
                    <tr
                      key={staff.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        isSuspended ? "bg-red-500/[0.02]" : ""
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              staff.role === "ADMIN"
                                ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground flex items-center gap-2">
                              {staff.name}
                              {isCurrentUser && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">{staff.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        {staff.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            <Shield className="w-3 h-3 text-blue-500" />
                            Front Desk
                          </span>
                        )}
                      </td>

                      {/* Module Permissions Chips */}
                      <td className="py-4 px-4">
                        {staff.role === "ADMIN" ? (
                          <span className="text-xs text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                            Full System Access (Admin)
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {staff.modules.length > 0 ? (
                              staff.modules.map((moduleKey) => {
                                const label = moduleMap.get(moduleKey) || moduleKey
                                return (
                                  <span
                                    key={moduleKey}
                                    className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground border border-border/70"
                                  >
                                    {label}
                                  </span>
                                )
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                No assigned modules
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
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

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <Link href={`/dashboard/staff/${staff.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-foreground hover:bg-muted"
                              title={`Edit permissions and credentials for ${staff.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5 text-primary" />
                              Edit
                            </Button>
                          </Link>

                          {/* Deactivate / Reactivate Toggle */}
                          <StaffStatusToggle
                            userId={staff.id}
                            userName={staff.name}
                            isActive={staff.isActive}
                            isCurrentUser={isCurrentUser}
                          />

                          {/* Delete Action */}
                          <DeleteStaffDialog
                            userId={staff.id}
                            userName={staff.name}
                            userEmail={staff.email}
                            isCurrentUser={isCurrentUser}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Phones & Small screens) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredStaff.map((staff) => {
              const isSuspended = !staff.isActive
              const isCurrentUser = staff.id === currentUserId
              const initials = staff.name
                ? staff.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "ST"

              return (
                <div
                  key={staff.id}
                  className={`p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3.5 ${
                    isSuspended ? "bg-red-500/[0.02]" : ""
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          staff.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                            : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          {staff.name}
                          {isCurrentUser && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{staff.email}</div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 border border-rose-500/20">
                          <ShieldAlert className="w-3 h-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role & Modules */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">Role:</span>
                      {staff.role === "ADMIN" ? (
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          Administrator (Universal Access)
                        </span>
                      ) : (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Front Desk / Staff
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-muted-foreground font-medium block mb-1">
                        Modules:
                      </span>
                      {staff.role === "ADMIN" ? (
                        <span className="text-xs text-purple-600 dark:text-purple-300 italic">
                          All modules accessible
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {staff.modules.length > 0 ? (
                            staff.modules.map((m) => (
                              <span
                                key={m}
                                className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium border"
                              >
                                {moduleMap.get(m) || m}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground italic">No modules</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                    <Link href={`/dashboard/staff/${staff.id}/edit`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-lg text-xs gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5 text-primary" />
                        Edit
                      </Button>
                    </Link>

                    <StaffStatusToggle
                      userId={staff.id}
                      userName={staff.name}
                      isActive={staff.isActive}
                      isCurrentUser={isCurrentUser}
                    />

                    <DeleteStaffDialog
                      userId={staff.id}
                      userName={staff.name}
                      userEmail={staff.email}
                      isCurrentUser={isCurrentUser}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
