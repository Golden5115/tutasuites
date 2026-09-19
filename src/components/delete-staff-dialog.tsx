"use client"

import { useState, useTransition } from "react"
import { deleteStaffAction } from "@/app/actions/staff-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, Loader2, AlertOctagon } from "lucide-react"

interface DeleteStaffDialogProps {
  userId: string
  userName: string
  userEmail: string
  isCurrentUser: boolean
}

export function DeleteStaffDialog({
  userId,
  userName,
  userEmail,
  isCurrentUser,
}: DeleteStaffDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleDelete = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await deleteStaffAction(userId)
      if (!res.success) {
        setErrorMsg(res.error || "Failed to delete staff account.")
      } else {
        setIsOpen(false)
      }
    })
  }

  if (isCurrentUser) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        title="You cannot delete your own account"
        className="text-muted-foreground/40 hover:bg-transparent h-8 w-8 p-0 cursor-not-allowed"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setErrorMsg(null)
          setIsOpen(true)
        }}
        title={`Delete account for ${userName}`}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 w-8 p-0 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader className="gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Delete Staff Account?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1.5">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 text-sm">
              <div className="font-semibold text-foreground">{userName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{userEmail}</div>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-400 leading-relaxed">
              ⚠️ This will permanently remove this staff member&apos;s login credentials and access rights from Tuta Suites.
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-medium text-red-600 dark:text-red-400">
                {errorMsg}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="rounded-lg text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Staff Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
