"use client"

import { Printer, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { printReceipt, buildReceiptHtml } from "@/lib/print-receipt"

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface ReceiptData {
  title: string
  orderNumber: string
  date: string
  customerName?: string
  roomNumber?: string
  orderType?: string // e.g. "Walk-in" or "Room Charge"
  items: ReceiptItem[]
  totalAmount: number
  paymentStatus?: string
}

interface ThermalReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  data: ReceiptData | null
}

export function ThermalReceiptModal({ isOpen, onClose, data }: ThermalReceiptModalProps) {
  if (!isOpen || !data) return null

  const handlePrint = () => {
    const html = buildReceiptHtml({
      title: data.title,
      orderNumber: data.orderNumber,
      date: data.date,
      customerName: data.customerName,
      roomNumber: data.roomNumber,
      orderType: data.orderType,
      items: data.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      })),
      totalAmount: data.totalAmount,
      paymentStatus: data.paymentStatus,
    })
    printReceipt(html)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
        
        {/* Screen Header Controls */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Order Completed
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 80mm RECEIPT PREVIEW */}
        <div className="bg-white text-black p-5 font-mono text-xs shadow-inner rounded-xl">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-black/30">
            <h2 className="text-base font-bold tracking-wider uppercase">TUTA SUITES</h2>
            <p className="text-[10px] text-zinc-600 leading-tight mt-0.5">
              Assurance CDA Estate, Orimerunmu<br />
              Mowe-Ibafo, Ogun State<br />
              Tel: +234 811 182 1899
            </p>
            <div className="mt-2 inline-block px-2 py-0.5 bg-zinc-100 font-bold tracking-widest text-[11px] uppercase rounded">
              *** {data.title} ***
            </div>
          </div>

          {/* Meta Info */}
          <div className="py-2.5 border-b border-dashed border-black/30 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-600">Order #:</span>
              <span className="font-bold">#{data.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Date:</span>
              <span>{data.date}</span>
            </div>
            {data.orderType && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Type:</span>
                <span className="font-bold">{data.orderType}</span>
              </div>
            )}
            {data.customerName && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Customer:</span>
                <span className="font-bold">{data.customerName}</span>
              </div>
            )}
            {data.roomNumber && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Room:</span>
                <span className="font-bold">Room {data.roomNumber}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-black/30">
            <div className="grid grid-cols-12 font-bold text-[10px] uppercase text-zinc-600 pb-1 mb-1 border-b border-black/10">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-4 text-right">Amount</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {data.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 text-[11px] leading-tight">
                  <span className="col-span-6 font-medium truncate pr-1">{item.name}</span>
                  <span className="col-span-2 text-center">{item.quantity}</span>
                  <span className="col-span-4 text-right font-bold">₦{item.totalPrice.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="py-3 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-black">
              <span>TOTAL:</span>
              <span>₦{data.totalAmount.toLocaleString()}</span>
            </div>
            {data.paymentStatus && (
              <div className="flex justify-between text-[10px] text-zinc-600 uppercase font-semibold">
                <span>Payment Status:</span>
                <span className="font-bold text-black">[{data.paymentStatus}]</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-3 border-t border-dashed border-black/30 text-[10px] text-zinc-600 leading-tight">
            <p className="font-bold text-black mb-0.5">THANK YOU FOR YOUR PATRONAGE!</p>
            <p>Please keep this receipt for your records.</p>
            <p className="mt-1 text-[8px] text-zinc-400">Powered by TutaSuites System</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button 
            onClick={handlePrint}
            className="flex-1 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-bold uppercase tracking-wider text-xs gap-2 py-5"
          >
            <Printer className="w-4 h-4" />
            Print Receipt (80mm)
          </Button>
          <Button 
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white hover:bg-white/5 text-xs py-5"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
