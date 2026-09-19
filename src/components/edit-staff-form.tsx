"use client"

import { useState, useActionState } from "react"
import { updateStaffAction } from "@/app/actions/staff-actions"
import { SYSTEM_MODULES, ROLE_DEFINITIONS } from "@/lib/staff-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCheck, 
  X, 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Info
} from "lucide-react"
import Link from "next/link"

interface EditStaffFormProps {
  staff: {
    id: string
    name: string
    email: string
    role: string
    modules: string[]
    isActive: boolean
  }
  isCurrentUser: boolean
}

export function EditStaffForm({ staff, isCurrentUser }: EditStaffFormProps) {
  const [state, formAction, isPending] = useActionState(updateStaffAction, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>(staff.role)
  const [selectedModules, setSelectedModules] = useState<string[]>(staff.modules || [])
  const [isActive, setIsActive] = useState<boolean>(staff.isActive)

  const handleModuleToggle = (moduleKey: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey]
    )
  }

  const handleSelectAll = () => {
    setSelectedModules(SYSTEM_MODULES.map((m) => m.key))
  }

  const handleClearAll = () => {
    setSelectedModules([])
  }

  return (
    <form action={formAction} className="space-y-8 max-w-4xl pb-16">
      <input type="hidden" name="userId" value={staff.id} />
      <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />

      {state?.error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Basic Account Credentials */}
      <Card className="shadow-sm border-border/80">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Profile & Account Information
          </CardTitle>
          <CardDescription>
            Update personal information, login email address, and account status.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={staff.name}
              required
              placeholder="e.g. John Doe"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={staff.email}
              required
              placeholder="e.g. staff@tutasuites.com"
              className="h-10"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Reset Password (Optional)
              </Label>
              <span className="text-xs text-muted-foreground">
                Leave empty to keep existing password
              </span>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password (min. 6 characters)"
                minLength={6}
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Account Status Switch */}
          <div className="sm:col-span-2 pt-2 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
              <div>
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  Account Status
                  {isActive ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isActive
                    ? "This staff member can sign in and perform daily duties according to their assigned permissions."
                    : "This account is currently blocked from signing in. All activity records remain preserved."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  disabled={isCurrentUser && isActive}
                  onClick={() => setIsActive(true)}
                  className={`text-xs h-8 ${isActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!isActive ? "destructive" : "outline"}
                  disabled={isCurrentUser}
                  onClick={() => setIsActive(false)}
                  className="text-xs h-8"
                >
                  Suspended
                </Button>
              </div>
            </div>
            {isCurrentUser && (
              <p className="text-[11px] text-muted-foreground mt-2 italic">
                * You are currently signed into this account and cannot deactivate it.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Assignment */}
      <Card className="shadow-sm border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">Staff Role</CardTitle>
          <CardDescription>
            Choose the core system role. Administrators have universal system rights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {ROLE_DEFINITIONS.map((r) => {
              const isSelected = selectedRole === r.value
              return (
                <label
                  key={r.value}
                  className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/[0.03] shadow-sm"
                      : "border-border/60 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-foreground">{r.label}</span>
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={isSelected}
                      onChange={() => setSelectedRole(r.value)}
                      className="h-4 w-4 text-primary accent-primary focus:ring-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {r.description}
                  </p>
                </label>
              )
            })}
          </div>

          {selectedRole === "ADMIN" && (
            <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
              <div>
                <strong>Administrator privileges:</strong> Admins can view all reports, manage financial analytics, edit all staff accounts, and configure system settings. Module permissions below will also customize their direct sidebar navigation.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Permissions */}
      <Card className="shadow-sm border-border/80">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Module Permissions</CardTitle>
            <CardDescription className="mt-1">
              Select which operational modules this staff member is authorized to access.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs h-8 gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-xs h-8 gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {SYSTEM_MODULES.map((m) => {
              const isChecked = selectedModules.includes(m.key)
              return (
                <label
                  key={m.key}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? "border-primary/40 bg-primary/[0.02] dark:bg-primary/[0.04]"
                      : "border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="modules"
                    value={m.key}
                    checked={isChecked}
                    onChange={() => handleModuleToggle(m.key)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary accent-primary focus:ring-primary shrink-0"
                  />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      {m.label}
                      {m.category === "financial" && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Financial
                        </span>
                      )}
                      {m.category === "admin" && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              Tip: For staff who only log operational receipts or purchases, grant <strong>Operating Expenses</strong> instead of <strong>Finance & Analytics</strong> to protect overall company profits and balance sheets.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border/80">
        <Link href="/dashboard/staff">
          <Button type="button" variant="outline" className="gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Staff List
          </Button>
        </Link>

        <Button
          type="submit"
          disabled={isPending}
          className="gap-2 px-6 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
