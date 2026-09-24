"use client"

import { Download, Printer, Check } from "lucide-react"
import { useState } from "react"

interface DownloadInvoiceButtonProps {
  bookingReference: string
}

export function DownloadInvoiceButton({ bookingReference }: DownloadInvoiceButtonProps) {
  const [downloaded, setDownloaded] = useState(false)

  const handlePrint = () => {
    setDownloaded(true)
    window.print()
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <button
      onClick={handlePrint}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
    >
      {downloaded ? (
        <>
          <Check className="w-4 h-4 text-black" />
          Invoice Ready!
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download / Save Invoice
        </>
      )}
    </button>
  )
}
