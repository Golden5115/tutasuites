"use client"

import { useTransition } from "react"
import { markRoomAsClean } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"

export function MarkCleanButton({ roomId }: { roomId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button 
      onClick={() => startTransition(async () => { await markRoomAsClean(roomId) })}
      disabled={isPending}
      variant="outline"
      className="w-full rounded-xl mt-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      Mark as Clean (Ready)
    </Button>
  )
}
