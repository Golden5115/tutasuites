import { getLaundryRequestById } from "@/app/actions/laundry-actions"
import { notFound } from "next/navigation"
import Image from "next/image"
import { PrintButton } from "./print-button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const request = await getLaundryRequestById(id)

  if (!request) {
    notFound()
  }

  const invoiceDate = new Date(request.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  // Build receipt HTML for popup print
  const itemsHtml = request.items
    .map(
      (item) => `
      <div class="item-row">
        <span class="col-item">${item.catalogItem.name}</span>
        <span class="col-qty">${item.quantity}</span>
        <span class="col-amt">₦${item.totalPrice.toLocaleString()}</span>
      </div>`
    )
    .join('')

  const receiptHtml = `
    <div class="receipt-header">
      <h2>TUTA SUITES</h2>
      <div class="address">
        Assurance CDA Estate, Orimerunmu<br/>
        Mowe-Ibafo, Ogun State<br/>
        Tel: +234 811 182 1899
      </div>
      <div class="title-badge">*** LAUNDRY INVOICE ***</div>
    </div>
    <div class="meta-section">
      <div class="meta-row"><span class="label">Invoice #:</span><span class="value">#${request.id.slice(-6).toUpperCase()}</span></div>
      <div class="meta-row"><span class="label">Date:</span><span class="value">${invoiceDate}</span></div>
      <div class="meta-row"><span class="label">Customer:</span><span class="value">${request.customerName}</span></div>
      ${request.roomNumber ? `<div class="meta-row"><span class="label">Room:</span><span class="value">Room ${request.roomNumber}</span></div>` : ''}
      <div class="meta-row"><span class="label">Status:</span><span class="value">[${request.paymentStatus}]</span></div>
    </div>
    <div class="items-section">
      <div class="items-header">
        <span class="col-item">Item</span>
        <span class="col-qty">Qty</span>
        <span class="col-amt">Amount</span>
      </div>
      ${itemsHtml}
    </div>
    <div class="total-section">
      <div class="total-row">
        <span>TOTAL:</span>
        <span>₦${request.totalAmount.toLocaleString()}</span>
      </div>
      <div class="status-row"><span>Payment:</span><span>${request.paymentStatus}</span></div>
    </div>
    <div class="receipt-footer">
      <div class="thanks">THANK YOU FOR YOUR PATRONAGE!</div>
      <div>Please keep this receipt for your records.</div>
      <div class="powered">Powered by TutaSuites System</div>
    </div>
  `

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans text-zinc-100">
      {/* Back and Print Action Header */}
      <div className="max-w-[380px] mx-auto mb-6 flex justify-between items-center">
        <Link 
          href="/dashboard/laundry"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
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
            Assurance CDA Estate, Orimerunmu<br />
            Mowe-Ibafo, Ogun State<br />
            Tel: +234 811 182 1899
          </p>
          <div className="mt-3 inline-block px-2.5 py-1 bg-zinc-100 font-bold tracking-widest text-[11px] uppercase rounded">
            *** LAUNDRY INVOICE ***
          </div>
        </div>

        {/* Invoice Info */}
        <div className="py-3 border-b border-dashed border-black/30 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-zinc-600">Invoice #:</span>
            <span className="font-bold">#{request.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Date:</span>
            <span>{invoiceDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Customer:</span>
            <span className="font-bold">{request.customerName}</span>
          </div>
          {request.roomNumber && (
            <div className="flex justify-between">
              <span className="text-zinc-600">Room:</span>
              <span className="font-bold">Room {request.roomNumber}</span>
            </div>
          )}
          <div className="flex justify-between pt-1">
            <span className="text-zinc-600">Payment Status:</span>
            <span className={`font-bold ${request.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-rose-700'}`}>
              [{request.paymentStatus}]
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
            {request.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 text-[11px] leading-tight">
                <span className="col-span-6 font-medium truncate pr-1">{item.catalogItem.name}</span>
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
            <span>₦{request.totalAmount.toLocaleString()}</span>
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
