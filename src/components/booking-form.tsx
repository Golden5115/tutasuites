"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Users, User, MapPin, MessageSquare, ShoppingBag, CreditCard, ChevronRight, ChevronLeft, Check } from "lucide-react"
import { createBooking, getSiteSettings } from "@/app/actions/booking-actions"

const AVAILABLE_EXTRAS = [
  { name: "Airport Pickup", price: 15000 },
  { name: "Breakfast (per day)", price: 5000 },
  { name: "Laundry Service", price: 3000 },
  { name: "Late Check-out (2PM)", price: 10000 },
  { name: "Extra Towels & Pillows", price: 2000 },
]

interface BookingFormProps {
  roomType: {
    name: string
    slug: string
    basePrice: number
    capacity: number
    images: string[]
  }
  settings: {
    taxPercent: number
    servicePercent: number
    currencySymbol: string
  }
  initialCheckIn?: string
  initialCheckOut?: string
  initialAdults?: number
  initialChildren?: number
}

type Step = "dates" | "guest" | "extras" | "review"

export function BookingForm({
  roomType,
  settings,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren,
}: BookingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("dates")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const today = new Date().toISOString().split("T")[0]

  // Dates
  const [checkIn, setCheckIn] = useState(initialCheckIn || "")
  const [checkOut, setCheckOut] = useState(initialCheckOut || "")
  const [adults, setAdults] = useState(initialAdults || 2)
  const [children, setChildren] = useState(initialChildren || 0)

  // Guest Info
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("Nigeria")
  const [specialRequests, setSpecialRequests] = useState("")

  // Extras
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({})

  // Calculations
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const roomPrice = roomType.basePrice * nights
  const extrasTotal = Object.entries(selectedExtras).reduce((sum, [name, qty]) => {
    const extra = AVAILABLE_EXTRAS.find((e) => e.name === name)
    return sum + (extra ? extra.price * qty : 0)
  }, 0)
  const subtotal = roomPrice + extrasTotal
  const taxAmount = (subtotal * settings.taxPercent) / 100
  const serviceCharge = (subtotal * settings.servicePercent) / 100
  const totalAmount = subtotal + taxAmount + serviceCharge

  const steps: Step[] = ["dates", "guest", "extras", "review"]
  const currentIndex = steps.indexOf(step)

  function nextStep() {
    if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1])
  }

  function prevStep() {
    if (currentIndex > 0) setStep(steps[currentIndex - 1])
  }

  function toggleExtra(name: string) {
    setSelectedExtras((prev) => {
      if (prev[name]) {
        const copy = { ...prev }
        delete copy[name]
        return copy
      }
      return { ...prev, [name]: 1 }
    })
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError("")
    try {
      const extras = Object.entries(selectedExtras).map(([name, quantity]) => ({
        name,
        price: AVAILABLE_EXTRAS.find((e) => e.name === name)?.price || 0,
        quantity,
      }))

      const result = await createBooking({
        roomTypeSlug: roomType.slug,
        checkIn,
        checkOut,
        adults,
        children,
        firstName,
        lastName,
        email,
        phone,
        country,
        specialRequests,
        extras,
      })

      // Redirect to payment / confirmation
      router.push(`/book/confirmation?ref=${result.bookingReference}&amount=${result.totalAmount}&id=${result.reservationId}`)
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Form Steps */}
      <div className="lg:col-span-2">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                  i <= currentIndex
                    ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                    : "bg-white/5 text-white/30 border-white/10"
                }`}
              >
                {i < currentIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px ${i < currentIndex ? "bg-[#D4AF37]" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
          {/* Step 1: Dates */}
          {step === "dates" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="font-heading text-2xl">Select Your Dates</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50">Check-in Date</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} min={today} required
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors [color-scheme:dark]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50">Check-out Date</label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn || today} required
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors [color-scheme:dark]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50">Adults</label>
                  <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors">
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n} className="bg-black">{n}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50">Children</label>
                  <select value={children} onChange={(e) => setChildren(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors">
                    {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n} className="bg-black">{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={nextStep} disabled={!checkIn || !checkOut || nights < 1}
                  className="px-8 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#F3E5AB] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Guest Info */}
          {step === "guest" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="font-heading text-2xl">Guest Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="John" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="Doe" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="john@example.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/50">Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" placeholder="+234 800 000 0000" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50">Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> Special Requests (Optional)
                </label>
                <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
                  placeholder="Any special requirements..." />
              </div>
              <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 bg-white/5 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 border border-white/10">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={nextStep} disabled={!firstName || !lastName || !email || !phone}
                  className="px-8 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#F3E5AB] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Extras */}
          {step === "extras" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="font-heading text-2xl">Add Extras</h2>
              </div>
              <p className="text-white/50 text-sm">Enhance your stay with these optional add-ons.</p>
              <div className="space-y-3">
                {AVAILABLE_EXTRAS.map((extra) => {
                  const isSelected = !!selectedExtras[extra.name]
                  return (
                    <button
                      key={extra.name}
                      onClick={() => toggleExtra(extra.name)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-white"
                          : "bg-white/[0.02] border-white/[0.06] text-white/70 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? "bg-[#D4AF37] border-[#D4AF37]" : "border-white/20"}`}>
                          {isSelected && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <span className="font-medium">{extra.name}</span>
                      </div>
                      <span className={`font-bold ${isSelected ? "text-[#D4AF37]" : "text-white/50"}`}>
                        {settings.currencySymbol}{extra.price.toLocaleString()}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 bg-white/5 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 border border-white/10">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={nextStep}
                  className="px-8 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#F3E5AB] transition-all flex items-center gap-2">
                  Review Booking <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === "review" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="font-heading text-2xl">Review & Pay</h2>
              </div>

              {/* Booking Summary */}
              <div className="space-y-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Room</span>
                  <span className="font-medium">{roomType.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Check-in</span>
                  <span className="font-medium">{new Date(checkIn).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Check-out</span>
                  <span className="font-medium">{new Date(checkOut).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Duration</span>
                  <span className="font-medium">{nights} night{nights > 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Guests</span>
                  <span className="font-medium">{adults} Adult{adults > 1 ? "s" : ""}{children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Guest Name</span>
                  <span className="font-medium">{firstName} {lastName}</span>
                </div>

                <div className="h-px bg-white/10 my-2" />

                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Room Price ({nights} × {settings.currencySymbol}{roomType.basePrice.toLocaleString()})</span>
                  <span className="font-medium">{settings.currencySymbol}{roomPrice.toLocaleString()}</span>
                </div>
                {extrasTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Extras</span>
                    <span className="font-medium">{settings.currencySymbol}{extrasTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Tax ({settings.taxPercent}%)</span>
                  <span className="font-medium">{settings.currencySymbol}{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Service Charge ({settings.servicePercent}%)</span>
                  <span className="font-medium">{settings.currencySymbol}{serviceCharge.toLocaleString()}</span>
                </div>

                <div className="h-px bg-white/10 my-2" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#D4AF37]">{settings.currencySymbol}{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={prevStep} className="px-6 py-3 bg-white/5 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 border border-white/10">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#F3E5AB] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? "Processing..." : "Proceed to Payment"}
                  <CreditCard className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Sticky Summary */}
      <div className="lg:col-span-1 hidden lg:block">
        <div className="sticky top-32 bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 space-y-4">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4">
            <img src={roomType.images[0] || "/dsc_0990.jpg"} alt={roomType.name} className="w-full h-full object-cover" />
          </div>
          <h3 className="font-heading text-xl">{roomType.name}</h3>
          <div className="h-px bg-white/10" />
          {nights > 0 && (
            <>
              <div className="flex justify-between text-sm text-white/50">
                <span>{nights} night{nights > 1 ? "s" : ""}</span>
                <span className="text-white font-medium">{settings.currencySymbol}{roomPrice.toLocaleString()}</span>
              </div>
              {extrasTotal > 0 && (
                <div className="flex justify-between text-sm text-white/50">
                  <span>Extras</span>
                  <span className="text-white font-medium">{settings.currencySymbol}{extrasTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-white/50">
                <span>Tax + Service</span>
                <span className="text-white font-medium">{settings.currencySymbol}{(taxAmount + serviceCharge).toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[#D4AF37]">{settings.currencySymbol}{totalAmount.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
