"use client"

import { useState } from "react"
import { markRoomAsClean } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Sparkles, CheckCircle2 } from "lucide-react"

export function CleanButton({ roomId }: { roomId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClean() {
    setLoading(true)
    await markRoomAsClean(roomId)
    setLoading(false)
  }

  return (
    <Button 
      onClick={handleClean} 
      disabled={loading}
      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 group"
    >
      {loading ? (
        "Updating..."
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4 group-hover:hidden" />
          <CheckCircle2 className="mr-2 h-4 w-4 hidden group-hover:block" />
          Mark as Clean
        </>
      )}
    </Button>
  )
}
