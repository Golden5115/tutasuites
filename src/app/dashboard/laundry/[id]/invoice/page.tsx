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

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans text-black">
      <div className="max-w-[800px] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link 
          href="/dashboard/laundry"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Laundry
        </Link>
        <PrintButton />
      </div>

      {/* Screen & Print Container */}
      <div className="print-thermal max-w-[800px] mx-auto bg-white p-8 md:p-12 shadow-sm rounded-2xl print:shadow-none print:p-2 print:max-w-none print:w-full print:rounded-none">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8 print:pb-3 print:mb-3 print:border-dashed print:border-black/30">
          <div>
            <div className="relative w-32 h-10 mb-4 print:hidden">
              <Image 
                src="/logo.png" 
                alt="Tuta Suites Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-xl font-bold tracking-wider uppercase text-black print:block hidden text-center">TUTA SUITES</h2>
            <p className="text-gray-500 text-sm print:text-[10px] print:text-black print:text-center">No 3 Owonikoko road, Assurance CDA Estate</p>
            <p className="text-gray-500 text-sm print:text-[10px] print:text-black print:text-center">Orimerunmu Mowe-ibafo | 0811 182 1899</p>
            <div className="hidden print:block text-center mt-2 font-bold text-xs uppercase">*** LAUNDRY INVOICE ***</div>
          </div>
          <div className="text-right print:hidden">
            <h1 className="text-4xl font-light tracking-widest text-gray-900 mb-2 uppercase">Invoice</h1>
            <p className="text-gray-400 text-sm">#{request.id.slice(-6).toUpperCase()}</p>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Date</p>
              <p className="text-sm font-medium">{invoiceDate}</p>
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
              <p className={`text-sm font-bold ${request.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                {request.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Billed To */}
        <div className="mb-8 print:mb-3 print:py-2 print:border-b print:border-dashed print:border-black/30 text-sm print:text-[11px]">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 print:text-black mb-1">Customer Details</p>
          <div className="flex justify-between">
            <span className="font-medium text-lg print:text-[11px] print:font-bold">{request.customerName}</span>
            <span className="text-gray-500 print:text-black font-semibold">#{request.id.slice(-6).toUpperCase()}</span>
          </div>
          {request.roomNumber && (
            <p className="text-gray-500 text-sm print:text-[10px] print:text-black">Room: {request.roomNumber}</p>
          )}
          <div className="hidden print:flex justify-between text-[10px] mt-1">
            <span>Date: {invoiceDate}</span>
            <span>Status: [{request.paymentStatus}]</span>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-left mb-8 print:mb-3 text-sm print:text-[11px]">
          <thead>
            <tr className="border-b border-gray-100 print:border-black/20">
              <th className="py-3 text-xs print:text-[10px] font-bold uppercase tracking-widest text-gray-400 print:text-black">Item</th>
              <th className="py-3 text-xs print:text-[10px] font-bold uppercase tracking-widest text-gray-400 print:text-black text-center">Qty</th>
              <th className="py-3 text-xs print:text-[10px] font-bold uppercase tracking-widest text-gray-400 print:text-black text-right">Price</th>
              <th className="py-3 text-xs print:text-[10px] font-bold uppercase tracking-widest text-gray-400 print:text-black text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {request.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 print:border-black/10">
                <td className="py-3 print:py-1 font-medium">{item.catalogItem.name}</td>
                <td className="py-3 print:py-1 text-center">{item.quantity}</td>
                <td className="py-3 print:py-1 text-right">₦{item.unitPrice.toLocaleString()}</td>
                <td className="py-3 print:py-1 text-right font-bold">₦{item.totalPrice.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end border-t border-gray-100 print:border-black pt-4 mb-8 print:mb-3">
          <div className="w-64 print:w-full">
            <div className="flex justify-between items-center py-2 print:py-1">
              <span className="text-base print:text-xs font-bold uppercase tracking-widest">Total Amount</span>
              <span className="text-2xl print:text-sm font-bold text-black">₦{request.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm print:text-[10px] text-gray-500 print:text-black">
              <span>Payment Status:</span>
              <span className="font-bold">{request.paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100 print:border-dashed print:border-black/30 text-center text-sm print:text-[10px] text-gray-400 print:text-black">
          <p className="font-bold">Thank you for choosing Tuta Suites Laundry.</p>
        </div>
      </div>
    </div>
  )
}
