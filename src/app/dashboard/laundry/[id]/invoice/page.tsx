import { getLaundryRequestById } from "@/app/actions/laundry-actions"
import { notFound } from "next/navigation"
import Image from "next/image"
import { PrintButton } from "./print-button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const request = await getLaundryRequestById(params.id)

  if (!request) {
    notFound()
  }

  const invoiceDate = new Date(request.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
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

      <div className="max-w-[800px] mx-auto bg-white p-12 shadow-sm rounded-2xl print:shadow-none print:p-0 print:rounded-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-12 mb-12">
          <div>
            <div className="relative w-32 h-10 mb-6">
              <Image 
                src="/logo.png" 
                alt="Tuta Suites Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <p className="text-gray-500 text-sm">No 3 Owonikoko road, Assurance CDA Estate</p>
            <p className="text-gray-500 text-sm">Orimerunmu Mowe-ibafo</p>
            <p className="text-gray-500 text-sm">0811 182 1899</p>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-light tracking-widest text-gray-900 mb-2 uppercase">Invoice</h1>
            <p className="text-gray-400 text-sm">#{request.id.slice(-6).toUpperCase()}</p>
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Date</p>
              <p className="text-sm font-medium">{invoiceDate}</p>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
              <p className={`text-sm font-bold ${request.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                {request.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Billed To */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Billed To</p>
          <h2 className="text-xl font-medium mb-1">{request.customerName}</h2>
          {request.roomNumber && (
            <p className="text-gray-500 text-sm">Room {request.roomNumber}</p>
          )}
        </div>

        {/* Items */}
        <table className="w-full text-left mb-12">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Description</th>
              <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Qty</th>
              <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Unit Price</th>
              <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {request.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-4 text-sm">{item.catalogItem.name}</td>
                <td className="py-4 text-sm text-center">{item.quantity}</td>
                <td className="py-4 text-sm text-right">₦{item.unitPrice.toLocaleString()}</td>
                <td className="py-4 text-sm text-right font-medium">₦{item.totalPrice.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between items-center border-b border-gray-100 py-3">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-sm">₦{request.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-sm font-bold uppercase tracking-widest">Total</span>
              <span className="text-xl font-medium">₦{request.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 pt-12 border-t border-gray-100 text-center text-sm text-gray-400">
          <p>Thank you for your business.</p>
        </div>
      </div>
    </div>
  )
}
