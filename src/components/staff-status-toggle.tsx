"use client"

import { useState, useTransition } from "react"
import { toggleStaffStatusAction } from "@/app/actions/staff-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserX, UserCheck, Loader2, AlertTriangle, ShieldCheck } from "lucide-react"

interface StaffStatusToggleProps {
  userId: string
  userName: string
  isActive: boolean
  isCurrentUser: boolean
}

export function StaffStatusToggle({
  userId,
  userName,
  isActive,
  isCurrentUser,
}: StaffStatusToggleProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleToggle = (targetStatus: boolean) => {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await toggleStaffStatusAction(userId, targetStatus)
      if (!res.success) {
        setErrorMsg(res.error || "Failed to update staff status.")
      } else {
        setShowConfirmDialog(false)
      }
    })
  }

  if (isCurrentUser) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        Current Account
      </span>
    )
  }

  return (
    <>
      {isActive ? (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setShowConfirmDialog(true)}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 text-xs font-medium h-8 gap-1.5 rounded-lg transition-all"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UserX className="w-3.5 h-3.5" />
          )}
          Deactivate
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleToggle(true)}
          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 text-xs font-medium h-8 gap-1.5 rounded-lg transition-all"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UserCheck className="w-3.5 h-3.5" />
          )}
          Reactivate
        </Button>
      )}

      {/* Confirmation Dialog for Deactivation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
          <DialogHeader className="gap-2">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Deactivate Staff Account?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to deactivate <strong className="text-foreground">{userName}</strong>?
              <br />
              <span className="inline-block mt-2 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2.5 rounded-lg border border-amber-500/20">
                ⚠️ This staff member will immediately be blocked from logging into Tuta Suites. All historical activity and records created by them will be safely preserved.
              </span>
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-2.5 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
              {errorMsg}
            </div>
          )}

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isPending}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleToggle(false)}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  Confirm Deactivation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
