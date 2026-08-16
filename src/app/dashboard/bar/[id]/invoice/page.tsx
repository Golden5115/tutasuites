import { getBarOrderById } from "@/app/actions/bar-actions"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PrintButton } from "@/app/dashboard/laundry/[id]/invoice/print-button"
import { buildReceiptHtml } from "@/lib/print-receipt"

export default async function BarInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getBarOrderById(id)

  if (!order) {
    notFound()
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const items = order.items.map((item) => ({
    name: item.item?.name || "Drink Item",
    quantity: item.quantity,
    totalPrice: item.totalPrice,
  }))

  const receiptHtml = buildReceiptHtml({
    title: "MINI LOUNGE RECEIPT",
    orderNumber: order.id.slice(-6).toUpperCase(),
    date: orderDate,
    customerName: order.customerName || (order.isWalkIn ? "Walk-in Guest" : order.reservation?.guest ? `${order.reservation.guest.firstName} ${order.reservation.guest.lastName}` : "Room Guest"),
    roomNumber: order.reservation?.room?.number,
    orderType: order.isWalkIn ? "Walk-in (Paid)" : `Room Bill (Room ${order.reservation?.room?.number || ''})`,
    items,
    totalAmount: order.totalAmount,
    paymentStatus: order.isWalkIn ? "COMPLETED" : "CHARGED TO ROOM",
  })

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans text-zinc-100">
      {/* Action Header */}
      <div className="max-w-[380px] mx-auto mb-6 flex justify-between items-center">
        <Link 
          href="/dashboard/bar"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bar POS
        </Link>
        <PrintButton receiptHtml={receiptHtml} />
      </div>

      {/* 80mm THERMAL RECEIPT PREVIEW (Screen Only) */}
      <div className="max-w-[380px] mx-auto bg-white text-black p-6 font-mono text-xs shadow-2xl rounded-2xl">
        
        {/* Header */}
        <div className="text-center pb-4 border-b border-dashed border-black/30">
          <div className="relative w-28 h-8 mx-auto mb-2">
            <Image 
              src="/logo.png" 
              alt="Tuta Suites Logo" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-base font-bold tracking-wider uppercase">TUTA SUITES</h2>
          <p className="text-[10px] text-zinc-600 leading-tight mt-0.5">
            3, Assurance CDA Estate, Orimerunmu<br />
            Mowe-Ibafo, Ogun State<br />
            Tel: +234 811 182 1899
          </p>
          <div className="mt-3 inline-block px-2.5 py-1 bg-zinc-100 font-bold tracking-widest text-[11px] uppercase rounded">
            *** MINI LOUNGE RECEIPT ***
          </div>
        </div>

        {/* Invoice Info */}
        <div className="py-3 border-b border-dashed border-black/30 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-zinc-600">Order #:</span>
            <span className="font-bold">#{order.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Date:</span>
            <span>{orderDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Type:</span>
            <span className="font-bold">{order.isWalkIn ? "Walk-in" : "Room Charge"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Customer:</span>
            <span className="font-bold">
              {order.customerName || (order.isWalkIn ? "Walk-in Guest" : order.reservation?.guest ? `${order.reservation.guest.firstName} ${order.reservation.guest.lastName}` : "Room Guest")}
            </span>
          </div>
          {order.reservation?.room && (
            <div className="flex justify-between">
              <span className="text-zinc-600">Room:</span>
              <span className="font-bold">Room {order.reservation.room.number}</span>
            </div>
          )}
          <div className="flex justify-between pt-1">
            <span className="text-zinc-600">Status:</span>
            <span className="font-bold text-emerald-700">
              [{order.isWalkIn ? "COMPLETED" : "CHARGED TO ROOM"}]
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-3 border-b border-dashed border-black/30">
          <div className="grid grid-cols-12 font-bold text-[10px] uppercase text-zinc-600 pb-1 mb-1 border-b border-black/10">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-4 text-right">Amount</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {order.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 text-[11px] leading-tight">
                <span className="col-span-6 font-medium truncate pr-1">{item.item?.name || "Drink Item"}</span>
                <span className="col-span-2 text-center">{item.quantity}</span>
                <span className="col-span-4 text-right font-bold">#{item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="py-3 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-sm font-bold pt-1 border-t border-black">
            <span>TOTAL:</span>
            <span>#{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-dashed border-black/30 text-[10px] text-zinc-600 leading-tight">
          <p className="font-bold text-black mb-0.5">THANK YOU FOR YOUR PATRONAGE!</p>
          <p>Please keep this receipt for your records.</p>
          <p className="mt-1.5 text-[8px] text-zinc-400">Powered by TutaSuites System</p>
        </div>
      </div>
    </div>
  )
}
