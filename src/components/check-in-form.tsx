"use client"

import { useState, useTransition, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { checkInGuest } from "@/app/actions"
import { CardContent } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"

export function CheckInForm({ availableRooms }: { availableRooms: any[] }) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [manualAmount, setManualAmount] = useState<number | "">("")

  const calculatedTotal = selectedRoomIds.reduce((total, id) => {
    const room = availableRooms.find(r => r.id === id)
    if (room && room.roomType) {
      return total + room.roomType.basePrice
    }
    return total
  }, 0)

  const displayAmount = manualAmount !== "" ? manualAmount : calculatedTotal

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId) 
        : [...prev, roomId]
    )
  }

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await checkInGuest(formData)
      setSelectedRoomIds([])
      formRef.current?.reset()
    })
  }

  return (
    <CardContent>
      <form ref={formRef} action={handleSubmit} className="grid gap-5">
        {/* Guest Details Section */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-1">Guest Information</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="premium-label">First Name</Label>
              <Input id="firstName" name="firstName" required placeholder="John" className="premium-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="premium-label">Last Name</Label>
              <Input id="lastName" name="lastName" required placeholder="Doe" className="premium-input" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="premium-label">Email (Optional)</Label>
              <Input id="email" name="email" type="email" placeholder="guest@email.com" className="premium-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="premium-label">Phone Number</Label>
              <Input id="phone" name="phone" required placeholder="+234 ..." className="premium-input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="premium-label">Full Address</Label>
            <Input id="address" name="address" placeholder="123 Street, City, State" className="premium-input" />
          </div>
        </div>

        {/* Room Selection Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Room Assignment</p>
            {selectedRoomIds.length > 0 && (
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {selectedRoomIds.length} {selectedRoomIds.length === 1 ? 'room' : 'rooms'} selected
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {availableRooms.map(room => {
              const isSelected = selectedRoomIds.includes(room.id)
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => toggleRoom(room.id)}
                  className={`
                    relative p-3 rounded-xl border text-left transition-all duration-200 group/room
                    ${isSelected 
                      ? 'border-primary/40 bg-primary/8 dark:bg-primary/12 shadow-[0_0_0_1px_rgba(201,162,39,0.2)] ring-1 ring-primary/20' 
                      : 'border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] hover:border-primary/20 hover:bg-primary/[0.03]'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white dark:text-black" />
                    </div>
                  )}
                  <p className="font-bold text-sm text-foreground">Room {room.number}</p>
                  <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mt-0.5">{room.roomType?.name}</p>
                  <p className="text-sm font-bold text-primary mt-1.5">₦{room.roomType?.basePrice?.toLocaleString()}</p>
                </button>
              )
            })}
            {availableRooms.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground/50 py-6 italic">All rooms are currently occupied.</p>
            )}
          </div>

          {/* Hidden inputs to pass selected room ids */}
          {selectedRoomIds.map(id => (
            <input key={id} type="hidden" name="roomIds" value={id} />
          ))}
        </div>

        {/* Additional Details */}
        <div className="space-y-3 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Booking Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="checkOutDate" className="premium-label">Check-Out Date & Time *</Label>
              <Input id="checkOutDate" name="checkOutDate" type="datetime-local" required className="premium-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalAmount" className="premium-label">Total Price (₦) *</Label>
              <Input 
                id="totalAmount" 
                name="totalAmount" 
                type="number" 
                value={displayAmount}
                onChange={(e) => setManualAmount(e.target.value ? parseFloat(e.target.value) : "")}
                required
                className="premium-input font-bold text-primary" 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numberOfGuests" className="premium-label">Guests</Label>
              <Input id="numberOfGuests" name="numberOfGuests" type="number" min="1" defaultValue="1" required className="premium-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valuableAssets" className="premium-label">Valuable Assets</Label>
              <Input id="valuableAssets" name="valuableAssets" placeholder="Laptop, Jewelry..." className="premium-input" />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={selectedRoomIds.length === 0 || isPending}
          className="gold-btn w-full mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking In...
            </>
          ) : (
            "Complete Check-In"
          )}
        </Button>
      </form>
    </CardContent>
  )
}
