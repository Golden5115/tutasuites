"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bike, Phone, ArrowRight, X, Sparkles } from "lucide-react"

export function DeliveryAnnouncementBar() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    // Only show if not previously dismissed in this session
    const isDismissed = sessionStorage.getItem("tuta_courier_bar_dismissed")
    if (!isDismissed) {
      setDismissed(false)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem("tuta_courier_bar_dismissed", "true")
  }

  if (dismissed) return null

  return (
    <aside aria-label="Announcement" className="relative z-[60] bg-gradient-to-r from-[#07130c] via-[#0f2318] to-[#07130c] text-white border-b border-[#D4AF37]/30 text-xs py-2.5 px-4 sm:px-8 transition-all">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Highlight Pill & Message */}
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-black font-extrabold uppercase tracking-widest text-[10px] shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.4)]">
            <Sparkles className="w-3 h-3 fill-black" />
            New
          </span>
          <p className="truncate text-white/90 text-[11px] sm:text-xs">
            <strong className="text-[#F3E5AB] font-semibold">TUTA COURIER SERVICE:</strong>{" "}
            Fast & reliable delivery across <span className="text-white font-medium">Mowe, Magboro, Ibafo, OPIC & Beyond</span>.
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <a
            href="tel:07075733866"
            className="hidden md:inline-flex items-center gap-1.5 text-white/80 hover:text-[#D4AF37] transition-colors font-medium text-[11px]"
          >
            <Phone className="w-3 h-3 text-[#D4AF37]" />
            <span>07075733866</span>
          </a>

          <Link
            href="/delivery"
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-[#D4AF37] hover:text-black border border-white/20 hover:border-[#D4AF37] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded transition-all duration-300"
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Book Courier</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <button
            onClick={handleDismiss}
            className="text-white/50 hover:text-white p-1 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
