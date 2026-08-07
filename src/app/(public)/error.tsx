"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the full error details to the server/browser logs for debugging
    console.error("TutaSuites Page Error:", error)
  }, [error])

  return (
    <section className="pt-40 pb-32 px-6 md:px-16 max-w-[600px] mx-auto text-center animate-fade-in">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-lg">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-[#D4AF37]" />
        </div>
        
        <h2 className="font-heading text-2xl md:text-3xl tracking-tight mb-3">
          Unable to Load Page
        </h2>

        <p className="text-white/60 text-sm md:text-base mb-8 leading-relaxed">
          We encountered an unexpected issue while retrieving your information. Our system has logged this event. Please try refreshing or return to the home page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-[#F3E5AB] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          
          <Link
            href="/"
            className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </section>
  )
}
