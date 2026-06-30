"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { extendStay } from "@/app/actions"
import { CalendarPlus, Loader2 } from "lucide-react"

export function ExtendStayForm({ reservationId, basePrice }: { reservationId: string, basePrice: number }) {
  const [extraDays, setExtraDays] = useState<number | "">("")
  const [isPending, startTransition] = useTransition()
  
  const calculatedAmount = typeof extraDays === 'number' ? extraDays * basePrice : 0

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await extendStay(formData)
      setExtraDays("")
    })
  }

  return (
    <form action={handleSubmit} className="flex gap-2">
      <input type="hidden" name="reservationId" value={reservationId} />
      <Input 
        type="number" 
        name="extraDays" 
        placeholder="Days" 
        min="1" 
        required 
        value={extraDays}
        onChange={(e) => setExtraDays(e.target.value ? parseInt(e.target.value, 10) : "")}
        className="w-20 premium-input h-9 text-xs" 
      />
      <Input 
        type="number" 
        name="additionalAmount" 
        placeholder="₦ Amount" 
        min="0" 
        step="1" 
        required 
        value={calculatedAmount || ""}
        readOnly
        className="flex-1 premium-input h-9 text-xs bg-muted/50 cursor-not-allowed font-bold text-primary" 
      />
      <Button type="submit" disabled={isPending} variant="outline" size="sm" className="h-9 px-3 rounded-xl border-black/[0.06] dark:border-white/[0.06] hover:bg-primary/8 hover:text-primary hover:border-primary/20 transition-all">
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CalendarPlus className="h-3.5 w-3.5" />
        )}
      </Button>
    </form>
  )
}
