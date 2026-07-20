"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Calendar, Users, Search } from "lucide-react"

export function SearchForm() {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)

  const today = new Date().toISOString().split("T")[0]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (checkIn) params.set("checkIn", checkIn)
    if (checkOut) params.set("checkOut", checkOut)
    params.set("adults", String(adults))
    params.set("children", String(children))
    router.push(`/rooms?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-4xl bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 md:p-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Check-in */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Check-in
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={today}
            required
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Check-out */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Check-out
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || today}
            required
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Guests */}
        <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Guests
          </label>
          <div className="flex gap-2">
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n} className="bg-black">{n} Adult{n > 1 ? "s" : ""}</option>
              ))}
            </select>
            <select
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n} className="bg-black">{n} Child{n !== 1 ? "ren" : ""}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex flex-col justify-end md:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="bg-[#D4AF37] text-black font-bold uppercase tracking-[0.15em] text-sm rounded-xl px-6 py-3.5 hover:bg-[#F3E5AB] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search Rooms
          </button>
        </div>
      </div>
    </form>
  )
}
