"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-black/80 transition-colors"
    >
      <Printer className="w-4 h-4" />
      Print Invoice
    </button>
  )
}
