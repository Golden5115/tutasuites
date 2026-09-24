"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, KeyRound } from "lucide-react"

export function BookingLookupForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [reference, setReference] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !reference) {
      setError("Please enter both your email and booking reference.")
      return
    }
    setError("")
    router.push(`/booking/${reference}?email=${encodeURIComponent(email)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 max-w-lg mx-auto space-y-6">
      <div className="text-center mb-4">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h2 className="font-heading text-2xl mb-2">Access Your Booking</h2>
        <p className="text-white/50 text-sm">Enter the email you used and your booking reference number.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-white/50">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="john@example.com"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-white/50">Booking Reference</label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value.toUpperCase())}
          required
          placeholder="HTL-20260718-0001"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors uppercase tracking-wider"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-[0.15em] text-sm rounded-xl hover:bg-[#F3E5AB] transition-all flex items-center justify-center gap-2"
      >
        <Search className="w-4 h-4" /> Find My Booking
      </button>
    </form>
  )
}
