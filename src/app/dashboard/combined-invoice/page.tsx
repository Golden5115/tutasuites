import { getCombinedReceiptData } from "@/app/actions/combined-order-actions"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Link2, Utensils, Wine } from "lucide-react"
import { PrintButton } from "@/app/dashboard/laundry/[id]/invoice/print-button"
import { buildReceiptHtml } from "@/lib/print-receipt"

export default async function CombinedInvoicePage({
  searchParams
}: {
  searchParams: Promise<{ restaurantId?: string; barId?: string }>
}) {
  const { restaurantId, barId } = await searchParams

  if (!restaurantId || !barId) {
    notFound()
  }

  const result = await getCombinedReceiptData({
    restaurantOrderId: restaurantId,
    barOrderId: barId
  })

  if (!result.success || !result.receiptData) {
    notFound()
  }

  const data = result.receiptData

  const receiptHtml = buildReceiptHtml({
    title: data.title,
    orderNumber: data.orderNumber,
    date: data.date,
    customerName: data.customerName,
    roomNumber: data.roomNumber,
    orderType: data.orderType,
    items: data.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      totalPrice: i.totalPrice
    })),
    totalAmount: data.totalAmount,
    paymentStatus: data.paymentStatus,
    sections: data.sections?.map((sec) => ({
      title: sec.title,
      items: sec.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        totalPrice: item.totalPrice
      })),
      subtotal: sec.subtotal
    })),
    linkedOrderNumbers: data.linkedOrderNumbers
  })

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans text-zinc-100">
      {/* Top Action Header */}
      <div className="max-w-[400px] mx-auto mb-6 flex justify-between items-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <PrintButton receiptHtml={receiptHtml} />
      </div>

      {/* 80mm THERMAL RECEIPT PREVIEW (Screen View) */}
      <div id="thermal-receipt-screen-preview" className="receipt-card max-w-[400px] mx-auto bg-white text-black p-6 font-mono text-xs shadow-2xl rounded-2xl">
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
            *** COMBINED FOOD & BAR RECEIPT ***
          </div>
        </div>

        {/* Invoice Info */}
        <div className="py-3 border-b border-dashed border-black/30 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-zinc-600">Order Ref:</span>
            <span className="font-bold">#{data.orderNumber}</span>
          </div>
          {data.linkedOrderNumbers?.restaurant && data.linkedOrderNumbers?.bar && (
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-600">Linked Sales:</span>
              <span className="font-bold text-zinc-800">
                Kitchen: #{data.linkedOrderNumbers.restaurant} | Bar: #{data.linkedOrderNumbers.bar}
              </span>
            </div>
          )}
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
          <div className="flex justify-between pt-1">
            <span className="text-zinc-600">Status:</span>
            <span className="font-bold text-emerald-700">
              [{data.paymentStatus || "COMPLETED"}]
            </span>
          </div>
        </div>

        {/* Sectioned Items */}
        {data.sections && data.sections.length > 0 ? (
          <div className="py-3 space-y-4 border-b border-dashed border-black/30">
            {data.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1 pb-3 border-b border-dashed border-black/20 last:border-none last:pb-0">
                <div className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 px-2 py-0.5 rounded inline-block text-zinc-800">
                  {section.title}
                </div>
                <div className="grid grid-cols-12 font-bold text-[9px] uppercase text-zinc-500 pb-1 border-b border-black/10">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Amount</span>
                </div>
                <div className="space-y-1 pt-1">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="grid grid-cols-12 text-[11px] leading-tight">
                      <span className="col-span-6 font-medium truncate pr-1">{item.name}</span>
                      <span className="col-span-2 text-center">{item.quantity}</span>
                      <span className="col-span-4 text-right font-bold">#{item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[11px] font-bold pt-1.5 border-t border-dotted border-black/20 text-zinc-700">
                  <span>{section.title} Subtotal:</span>
                  <span>#{section.subtotal.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                  <span className="col-span-4 text-right font-bold">#{item.totalPrice.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grand Total */}
        <div className="py-3 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-base font-bold pt-1 border-t-2 border-black">
            <span>COMBINED TOTAL:</span>
            <span>#{data.totalAmount.toLocaleString()}</span>
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
