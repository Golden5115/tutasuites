"use client"

import { Printer } from "lucide-react"
import { printReceipt } from "@/lib/print-receipt"

interface LaundryPrintButtonProps {
  receiptHtml: string
}

export function PrintButton({ receiptHtml }: LaundryPrintButtonProps) {
  const handlePrint = () => {
    printReceipt(receiptHtml)
  }

  return (
    <button 
      onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-md"
    >
      <Printer className="w-4 h-4" />
      Print Receipt (80mm)
    </button>
  )
}
