import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, Calendar, CreditCard, MapPin, Phone, Mail, BedDouble, ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { DownloadInvoiceButton } from "@/components/download-invoice-button"

interface Props {
  searchParams: Promise<{
    ref?: string
    amount?: string
    id?: string
  }>
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const sp = await searchParams
  if (!sp.ref) notFound()

  const reservation = await prisma.reservation.findUnique({
    where: { bookingReference: sp.ref },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      extras: true,
    },
  })

  if (!reservation) notFound()

  const formattedCheckIn = new Date(reservation.checkIn).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const formattedCheckOut = new Date(reservation.checkOut).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const bookingDate = new Date(reservation.createdAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <section className="pt-32 pb-24 px-4 sm:px-6 md:px-12 max-w-[840px] mx-auto animate-in fade-in duration-500">
      {/* Top Banner (Hidden in Print) */}
      <div className="text-center mb-8 print:hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9 text-emerald-400" />
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-white mb-2">
          Reservation Confirmed!
        </h1>
        <p className="text-white/60 text-sm max-w-md mx-auto">
          Thank you for choosing Tuta Suites. Your official booking invoice is ready below.
        </p>
      </div>

      {/* Action Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <DownloadInvoiceButton bookingReference={reservation.bookingReference || "TS-BOOKING"} />
      </div>

      {/* OFFICIAL INVOICE CARD (Optimized for Mobile Screen & Print/PDF) */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl print:bg-white print:text-black print:p-8 print:border-none print:shadow-none print:rounded-none">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-white/10 print:border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center print:bg-gray-100">
                <BedDouble className="w-5 h-5 text-[#D4AF37] print:text-black" />
              </div>
              <span className="text-xl font-bold tracking-wider font-heading text-white print:text-black">
                TUTA SUITES
              </span>
            </div>
            <p className="text-xs text-white/50 print:text-gray-600 leading-relaxed max-w-xs">
              3, Assurance CDA Estate, Orimerunmu<br />
              Mowe-Ibafo, Ogun State, Nigeria<br />
              Tel: +234 811 182 1899
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="inline-block px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-lg text-xs font-bold uppercase tracking-wider text-[#D4AF37] print:bg-gray-100 print:text-black print:border-gray-300 mb-1">
              Official Booking Invoice
            </div>
            <p className="text-xs text-white/50 print:text-gray-600">
              Date: <span className="font-semibold text-white/80 print:text-black">{bookingDate}</span>
            </p>
            <p className="text-xs text-white/50 print:text-gray-600">
              Reference: <span className="font-bold text-[#D4AF37] print:text-black">#{reservation.bookingReference}</span>
            </p>
          </div>
        </div>

        {/* Guest & Reservation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 text-xs">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5 print:bg-gray-50 print:border-gray-200">
            <p className="font-bold uppercase tracking-wider text-white/40 print:text-gray-500 text-[10px]">
              Guest Details
            </p>
            <p className="text-sm font-bold text-white print:text-black">
              {reservation.guest.firstName} {reservation.guest.lastName}
            </p>
            {reservation.guest.email && (
              <p className="text-white/60 print:text-gray-600 truncate">{reservation.guest.email}</p>
            )}
            {reservation.guest.phone && (
              <p className="text-white/60 print:text-gray-600">{reservation.guest.phone}</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5 print:bg-gray-50 print:border-gray-200">
            <p className="font-bold uppercase tracking-wider text-white/40 print:text-gray-500 text-[10px]">
              Stay Details
            </p>
            <p className="text-sm font-bold text-[#D4AF37] print:text-black">
              {reservation.room.roomType.name} (Room {reservation.room.number})
            </p>
            <p className="text-white/60 print:text-gray-600">
              Check-in: <span className="font-medium text-white print:text-black">{formattedCheckIn}</span>
            </p>
            <p className="text-white/60 print:text-gray-600">
              Check-out: <span className="font-medium text-white print:text-black">{formattedCheckOut}</span> ({reservation.nights} night{reservation.nights > 1 ? "s" : ""})
            </p>
          </div>
        </div>

        {/* Itemized Price Table */}
        <div className="space-y-3 pt-2">
          <div className="rounded-2xl border border-white/10 overflow-hidden print:border-gray-300">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/5 uppercase text-[10px] tracking-wider text-white/50 print:bg-gray-100 print:text-gray-700">
                <tr>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-center">Duration</th>
                  <th className="p-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-gray-200">
                <tr>
                  <td className="p-3.5">
                    <p className="font-semibold text-white print:text-black">{reservation.room.roomType.name}</p>
                    <p className="text-[11px] text-white/50 print:text-gray-500">Room Accommodation (Room {reservation.room.number})</p>
                  </td>
                  <td className="p-3.5 text-center text-white/70 print:text-black">
                    {reservation.nights} Night{reservation.nights > 1 ? "s" : ""}
                  </td>
                  <td className="p-3.5 text-right font-bold text-white print:text-black">
                    ₦{reservation.roomPrice.toLocaleString()}
                  </td>
                </tr>

                {reservation.extras.map((extra) => (
                  <tr key={extra.id}>
                    <td className="p-3.5">
                      <p className="font-semibold text-white print:text-black">{extra.name}</p>
                      <p className="text-[11px] text-white/50 print:text-gray-500">Additional Booking Extra</p>
                    </td>
                    <td className="p-3.5 text-center text-white/70 print:text-black">
                      x{extra.quantity}
                    </td>
                    <td className="p-3.5 text-right font-bold text-white print:text-black">
                      ₦{(extra.price * extra.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs print:bg-transparent print:border-none">
            <div className="flex justify-between text-white/60 print:text-gray-600">
              <span>Service Charge (5%)</span>
              <span>₦{reservation.serviceCharge.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-white/60 print:text-gray-600">
              <span>VAT / Tax (7.5%)</span>
              <span>₦{reservation.taxAmount.toLocaleString()}</span>
            </div>

            <div className="h-px bg-white/10 print:bg-gray-300 my-2" />

            <div className="flex justify-between text-base font-bold">
              <span className="text-white print:text-black">Total Paid:</span>
              <span className="text-[#D4AF37] print:text-black">₦{reservation.totalAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center pt-1 text-[11px]">
              <span className="text-white/50 print:text-gray-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" /> Payment Status:
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-md ${
                reservation.paymentStatus === "PAID"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 print:text-emerald-700"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30 print:text-amber-700"
              }`}>
                {reservation.paymentStatus === "PAID" ? "VERIFIED & PAID" : reservation.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Footer / Terms */}
        <div className="pt-4 border-t border-white/10 print:border-gray-300 text-center text-[10px] text-white/40 print:text-gray-500 space-y-1">
          <p className="font-semibold text-white/70 print:text-gray-800 uppercase tracking-wider">
            Thank you for choosing Tuta Suites!
          </p>
          <p>Please present this confirmation or your booking reference at check-in.</p>
          <p className="text-[9px] text-white/30 print:text-gray-400">
            For support or enquiries, call +234 811 182 1899 or email info@tutasuites.com
          </p>
        </div>
      </div>

      {/* Bottom CTA (Hidden in Print) */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center print:hidden">
        {reservation.paymentStatus !== "PAID" && (
          <Link
            href={`/api/paystack/initialize?reservationId=${reservation.id}`}
            className="px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#F3E5AB] text-black text-xs font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
          >
            <CreditCard className="w-4 h-4" /> Complete Payment with Paystack
          </Link>
        )}
        <Link
          href={`/booking?email=${reservation.guest.email || ''}&ref=${reservation.bookingReference || ''}`}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-center text-white transition-all"
        >
          View in Guest Portal
        </Link>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-center text-white transition-all"
        >
          Return to Homepage
        </Link>
      </div>
    </section>
  )
}
