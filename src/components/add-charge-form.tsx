"use client"

import { useState } from "react"
import { addRoomCharge } from "@/app/actions/pos-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Coffee } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AddChargeForm({ reservationId }: { reservationId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const quantity = parseInt(formData.get("quantity") as string, 10) || 1

    const result = await addRoomCharge(reservationId, name, price, quantity)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3 w-full transition-colors">
        <Coffee className="h-3.5 w-3.5" />
        Add Charge
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Room Charge</DialogTitle>
          <DialogDescription>
            Bill room service, laundry, or minibar items directly to the guest's tab.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Item / Service Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Jollof Rice, Laundry" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Unit Price (₦)</Label>
              <Input id="price" name="price" type="number" step="0.01" required placeholder="e.g. 5000" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min="1" required defaultValue="1" className="rounded-xl" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-xl shadow-lg shadow-primary/20 mt-4">
            {loading ? "Adding Charge..." : "Add to Guest Tab"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
