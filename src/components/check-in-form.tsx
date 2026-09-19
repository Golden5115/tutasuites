"use client"

import { useState, useTransition, useRef, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { checkInGuest } from "@/app/actions"
import { CardContent } from "@/components/ui/card"
import { 
  Check, 
  Loader2, 
  Moon, 
  Clock, 
  Lock, 
  Unlock, 
  Info, 
  User, 
  BedDouble, 
  Calendar,
  Sparkles
} from "lucide-react"

function formatDateTimeForInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function computeCheckoutDate(
  type: "DAILY" | "HOURLY",
  nights: number,
  hours: number
): Date {
  const now = new Date()
  if (type === "HOURLY") {
    return new Date(now.getTime() + hours * 60 * 60 * 1000)
  } else {
    const d = new Date(now)
    if (now.getHours() < 6) {
      d.setHours(12, 0, 0, 0)
    } else {
      d.setDate(d.getDate() + nights)
      d.setHours(12, 0, 0, 0)
    }
    return d
  }
}

export function CheckInForm({ availableRooms }: { availableRooms: any[] }) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // Booking Type: DAILY (24hrs) vs HOURLY (Short Time)
  const [bookingType, setBookingType] = useState<"DAILY" | "HOURLY">("DAILY")
  const [nights, setNights] = useState<number>(1)
  const [durationHours, setDurationHours] = useState<number>(2)
  const [numberOfGuests, setNumberOfGuests] = useState<number>(1)

  // Editable short time price
  const [customShortTimePrice, setCustomShortTimePrice] = useState<number | "">("")

  // Check-out datetime string
  const [checkOutDateTime, setCheckOutDateTime] = useState<string>(() =>
    formatDateTimeForInput(computeCheckoutDate("DAILY", 1, 2))
  )

  // Keep checkout date in sync when booking type, nights, or hours change
  useEffect(() => {
    const computed = computeCheckoutDate(bookingType, nights, durationHours)
    setCheckOutDateTime(formatDateTimeForInput(computed))
  }, [bookingType, nights, durationHours])

  // Selected rooms calculation
  const selectedRooms = useMemo(() => {
    return availableRooms.filter((r) => selectedRoomIds.includes(r.id))
  }, [availableRooms, selectedRoomIds])

  // Fixed 24hrs total (cannot be edited)
  const fixedDailyTotal = useMemo(() => {
    const baseSum = selectedRooms.reduce((sum, room) => {
      const price = room.roomType?.basePrice || 0
      return sum + price * nights
    }, 0)

    const allowedGuests = selectedRoomIds.length * 2
    const extraGuests = Math.max(0, numberOfGuests - allowedGuests)
    const extraCharge = selectedRoomIds.length > 0 ? extraGuests * 5000 : 0

    return baseSum + extraCharge
  }, [selectedRooms, nights, numberOfGuests, selectedRoomIds.length])

  // Default suggested short time price
  const suggestedHourlyTotal = useMemo(() => {
    return selectedRooms.reduce((sum, room) => {
      const hourlyUnit =
        room.roomType?.hourlyPrice ||
        Math.round((room.roomType?.basePrice || 0) * 0.4)
      return sum + hourlyUnit
    }, 0)
  }, [selectedRooms])

  // Display and submission price
  const isDaily = bookingType === "DAILY"
  const currentTotalAmount = isDaily
    ? fixedDailyTotal
    : customShortTimePrice !== ""
    ? customShortTimePrice
    : suggestedHourlyTotal

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    )
  }

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await checkInGuest(formData)
      setSelectedRoomIds([])
      setCustomShortTimePrice("")
      formRef.current?.reset()
    })
  }

  return (
    <CardContent className="pt-5">
      <form ref={formRef} action={handleSubmit} className="grid gap-6">
        {/* SECTION 1: Guest Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              1. Guest Information
            </p>
            <span className="text-[10px] text-muted-foreground">Required fields *</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="premium-label">
                First Name *
              </Label>
              <Input
                id="firstName"
                name="firstName"
                required
                placeholder="e.g. John"
                className="premium-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="premium-label">
                Last Name *
              </Label>
              <Input
                id="lastName"
                name="lastName"
                required
                placeholder="e.g. Doe"
                className="premium-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="premium-label">
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                required
                placeholder="e.g. +234 801 234 5678"
                className="premium-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="premium-label">
                Email (Optional)
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="guest@email.com"
                className="premium-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="premium-label">
              Residential Address (Optional)
            </Label>
            <Input
              id="address"
              name="address"
              placeholder="e.g. Victoria Island, Lagos"
              className="premium-input"
            />
          </div>
        </div>

        {/* SECTION 2: Booking Type (24hrs vs Short Time) */}
        <div className="space-y-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              2. Booking Type & Duration
            </p>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {isDaily ? "24hrs Stay Selected" : "Short Time Stay Selected"}
            </span>
          </div>

          {/* Stay Type Choice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 24hrs Card */}
            <div
              onClick={() => setBookingType("DAILY")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative ${
                isDaily
                  ? "border-primary bg-primary/[0.04] dark:bg-primary/[0.08] shadow-sm ring-1 ring-primary/20"
                  : "border-black/[0.08] dark:border-white/[0.08] hover:border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDaily ? "bg-primary text-white dark:text-black" : "bg-muted text-muted-foreground"
                  }`}>
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">24 Hours Stay</p>
                    <p className="text-[11px] text-muted-foreground">Standard full hotel stay</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Lock className="w-2.5 h-2.5" /> Fixed Price
                </span>
              </div>

              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Room prices are strictly fixed to official catalog rates.</span>
              </div>
            </div>

            {/* Short Time Card */}
            <div
              onClick={() => setBookingType("HOURLY")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative ${
                !isDaily
                  ? "border-emerald-500 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] shadow-sm ring-1 ring-emerald-500/20"
                  : "border-black/[0.08] dark:border-white/[0.08] hover:border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    !isDaily ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Short Time Stay</p>
                    <p className="text-[11px] text-muted-foreground">Spend few hours to rest</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Unlock className="w-2.5 h-2.5" /> Editable Price
                </span>
              </div>

              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Front desk can customize/edit room price for short stay.</span>
              </div>
            </div>
          </div>

          {/* Duration Selector based on Category */}
          {isDaily ? (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Label htmlFor="nights" className="text-xs font-semibold text-foreground">
                  Number of Nights
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Checkout is 12:00 PM on checkout day.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNights(n)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      nights === n
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-background border border-border/80 text-foreground hover:bg-muted"
                    }`}
                  >
                    {n} {n === 1 ? "Night" : "Nights"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Label htmlFor="durationHours" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Short Stay Duration (Hours)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Quick rest hours for this guest.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 6].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDurationHours(h)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      durationHours === h
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-background border border-border/80 text-foreground hover:bg-muted"
                    }`}
                  >
                    {h} {h === 1 ? "Hr" : "Hrs"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hidden inputs to send to server */}
          <input type="hidden" name="bookingType" value={bookingType} />
          <input type="hidden" name="nights" value={nights} />
          <input type="hidden" name="durationHours" value={durationHours} />
        </div>

        {/* SECTION 3: Room Selection */}
        <div className="space-y-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5" />
              3. Room Assignment
            </p>
            {selectedRoomIds.length > 0 && (
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                {selectedRoomIds.length} {selectedRoomIds.length === 1 ? "room" : "rooms"} selected
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {availableRooms.map((room) => {
              const isSelected = selectedRoomIds.includes(room.id)
              const basePrice = room.roomType?.basePrice || 0
              const hourlyPrice =
                room.roomType?.hourlyPrice || Math.round(basePrice * 0.4)

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => toggleRoom(room.id)}
                  className={`
                    relative p-3 rounded-xl border text-left transition-all duration-200 group/room
                    ${
                      isSelected
                        ? "border-primary/40 bg-primary/8 dark:bg-primary/12 shadow-[0_0_0_1px_rgba(201,162,39,0.2)] ring-1 ring-primary/20"
                        : "border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] hover:border-primary/20 hover:bg-primary/[0.03]"
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white dark:text-black" />
                    </div>
                  )}
                  <p className="font-bold text-sm text-foreground">Room {room.number}</p>
                  <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mt-0.5">
                    {room.roomType?.name}
                  </p>
                  <div className="mt-1.5">
                    {isDaily ? (
                      <p className="text-xs font-bold text-primary">
                        ₦{basePrice.toLocaleString()}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">/ night</span>
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ₦{hourlyPrice.toLocaleString()}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">/ short stay</span>
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
            {availableRooms.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground/50 py-6 italic">
                All rooms are currently occupied.
              </p>
            )}
          </div>

          {/* Hidden inputs to pass selected room ids */}
          {selectedRoomIds.map((id) => (
            <input key={id} type="hidden" name="roomIds" value={id} />
          ))}
        </div>

        {/* SECTION 4: Stay Details & Total Price */}
        <div className="space-y-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            4. Stay Schedule & Billing
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Check-Out Date & Time */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="checkOutDate" className="premium-label">
                  Expected Check-Out *
                </Label>
                <span className="text-[10px] text-muted-foreground">Auto-calculated</span>
              </div>
              <Input
                id="checkOutDate"
                name="checkOutDate"
                type="datetime-local"
                required
                value={checkOutDateTime}
                onChange={(e) => setCheckOutDateTime(e.target.value)}
                className="premium-input font-medium"
              />
            </div>

            {/* Total Price Section with 24hrs (Fixed) vs Short Time (Editable) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="totalAmount" className="premium-label flex items-center gap-1">
                  Total Price (₦) *
                  {isDaily ? (
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                      Fixed 24hrs
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      Editable Short Time
                    </span>
                  )}
                </Label>
                {isDaily ? (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Catalog rate
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Unlock className="w-2.5 h-2.5" /> Editable
                  </span>
                )}
              </div>

              <div className="relative">
                {isDaily ? (
                  <>
                    <Input
                      id="totalAmount"
                      name="totalAmount"
                      type="number"
                      value={currentTotalAmount}
                      readOnly
                      required
                      className="premium-input font-bold text-primary bg-muted/40 cursor-not-allowed pr-10"
                    />
                    <Lock className="w-4 h-4 text-muted-foreground/60 absolute right-3 top-1/2 -translate-y-1/2" />
                  </>
                ) : (
                  <>
                    <Input
                      id="totalAmount"
                      name="totalAmount"
                      type="number"
                      value={currentTotalAmount}
                      onChange={(e) =>
                        setCustomShortTimePrice(
                          e.target.value ? parseFloat(e.target.value) : ""
                        )
                      }
                      required
                      placeholder="Enter agreed price..."
                      className="premium-input font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/40 focus:border-emerald-500 pr-10"
                    />
                    <Unlock className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  </>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground mt-1">
                {isDaily ? (
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-blue-500 shrink-0" />
                    24hrs room rates cannot be edited (locked to official base prices).
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3 shrink-0" />
                    Short time pricing is editable. You can adjust the amount as agreed with the guest.
                  </span>
                )}
              </p>
            </div>

            {/* Number of Guests */}
            <div className="space-y-1.5">
              <Label htmlFor="numberOfGuests" className="premium-label">
                Number of Guests
              </Label>
              <Input
                id="numberOfGuests"
                name="numberOfGuests"
                type="number"
                min="1"
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                required
                className="premium-input"
              />
            </div>

            {/* Valuable Assets */}
            <div className="space-y-1.5">
              <Label htmlFor="valuableAssets" className="premium-label">
                Valuable Assets Declared
              </Label>
              <Input
                id="valuableAssets"
                name="valuableAssets"
                placeholder="Laptop, Jewelry, Luggage..."
                className="premium-input"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={selectedRoomIds.length === 0 || isPending}
          className="gold-btn w-full mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none h-11 text-sm font-bold shadow-md"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Check-In...
            </>
          ) : (
            `Complete Check-In (${isDaily ? "24hrs Stay" : "Short Time Stay"} — ₦${Number(
              currentTotalAmount || 0
            ).toLocaleString()})`
          )}
        </Button>
      </form>
    </CardContent>
  )
}
