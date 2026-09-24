"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { checkOutGuest } from "@/app/actions"
import { LogOut, Loader2 } from "lucide-react"

export function CheckOutButton({ roomId, reservationId }: { roomId: string, reservationId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleCheckOut = () => {
    startTransition(async () => {
      await checkOutGuest(roomId, reservationId)
    })
  }

  return (
    <Button 
      type="button" 
      onClick={handleCheckOut}
      disabled={isPending}
      variant="outline" 
      className="w-full rounded-xl border-black/[0.06] dark:border-white/[0.06] hover:bg-red-500/8 dark:hover:bg-red-500/12 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/20 transition-all h-10 text-sm font-semibold"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4 mr-2" />
      )}
      Check-Out
    </Button>
  )
}
