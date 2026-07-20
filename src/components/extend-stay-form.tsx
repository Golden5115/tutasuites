"use client"

import { useState, useTransition } from "react"
import { extendStay } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarPlus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ExtendStayForm({ reservationId, basePrice }: { reservationId: string, basePrice: number }) {
  const [open, setOpen] = useState(false)
  const [extraDays, setExtraDays] = useState<number | "">("")
  const [isPending, startTransition] = useTransition()
  
  const calculatedAmount = typeof extraDays === 'number' ? extraDays * basePrice : 0

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await extendStay(formData)
      setExtraDays("")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 h-8 px-3 w-full transition-colors">
        <CalendarPlus className="h-3.5 w-3.5" />
        Extend Stay
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Extend Stay</DialogTitle>
          <DialogDescription>
            Add extra days to this reservation. The room base price is ₦{basePrice.toLocaleString()}/night.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 pt-4">
          <input type="hidden" name="reservationId" value={reservationId} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="extraDays">Extra Days</Label>
              <Input 
                id="extraDays"
                type="number" 
                name="extraDays" 
                placeholder="Days" 
                min="1" 
                required 
                value={extraDays}
                onChange={(e) => setExtraDays(e.target.value ? parseInt(e.target.value, 10) : "")}
                className="rounded-xl" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalAmount">Additional Amount (₦)</Label>
              <Input 
                id="additionalAmount"
                type="number" 
                name="additionalAmount" 
                required 
                value={calculatedAmount || ""}
                readOnly
                className="rounded-xl bg-muted/50 cursor-not-allowed font-bold text-primary" 
              />
            </div>
          </div>

          <Button type="submit" disabled={isPending || !extraDays} className="w-full rounded-xl shadow-lg shadow-primary/20 mt-4">
            {isPending ? "Updating..." : "Confirm Extension"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
