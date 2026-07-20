import Link from "next/link"
import { CheckCircle, Calendar, CreditCard, MapPin, Download } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

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

  return (
    <section className="pt-40 pb-32 px-6 md:px-16 max-w-[800px] mx-auto">
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="font-heading text-4xl md:text-5xl tracking-tight mb-3">Booking Confirmed!</h1>
        <p className="text-white/60 text-lg">Your reservation has been successfully created.</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 space-y-6">
        {/* Booking Reference */}
        <div className="text-center bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Booking Reference</p>
          <p className="text-3xl font-bold text-[#D4AF37] tracking-wider">{reservation.bookingReference}</p>
          <p className="text-xs text-white/40 mt-2">Save this reference to manage your booking</p>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Guest Name</span>
            <span className="font-medium">{reservation.guest.firstName} {reservation.guest.lastName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Email</span>
            <span className="font-medium">{reservation.guest.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Room</span>
            <span className="font-medium">{reservation.room.roomType.name} — Room {reservation.room.number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Check-in</span>
            <span className="font-medium">{new Date(reservation.checkIn).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Check-out</span>
            <span className="font-medium">{new Date(reservation.checkOut).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Duration</span>
            <span className="font-medium">{reservation.nights} night{reservation.nights > 1 ? "s" : ""}</span>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex justify-between text-sm">
            <span className="text-white/50">Room Price</span>
            <span className="font-medium">₦{reservation.roomPrice.toLocaleString()}</span>
          </div>
          {reservation.extrasAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Extras</span>
              <span className="font-medium">₦{reservation.extrasAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Tax</span>
            <span className="font-medium">₦{reservation.taxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Service Charge</span>
            <span className="font-medium">₦{reservation.serviceCharge.toLocaleString()}</span>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-[#D4AF37]">₦{reservation.totalAmount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-white/50 flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Payment Status</span>
            <span className={`font-bold ${reservation.paymentStatus === "PAID" ? "text-emerald-400" : "text-amber-400"}`}>
              {reservation.paymentStatus}
            </span>
          </div>
        </div>

        {/* Payment CTA if unpaid */}
        {reservation.paymentStatus === "UNPAID" && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="text-amber-300 text-sm font-medium mb-3">Payment is pending. Complete payment to confirm your booking.</p>
            <Link
              href={`/api/paystack/initialize?reservationId=${reservation.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#F3E5AB] transition-all"
            >
              <CreditCard className="w-4 h-4" /> Pay Now
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            href={`/booking?email=${reservation.guest.email}&ref=${reservation.bookingReference}`}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-bold uppercase tracking-wider text-center border border-white/10"
          >
            View Booking Details
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-bold uppercase tracking-wider text-center border border-white/10"
          >
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hotel Info */}
      <div className="mt-8 text-center text-white/40 text-sm">
        <p className="flex items-center justify-center gap-2"><MapPin className="w-4 h-4" /> 123 Luxury Avenue, Metropolis</p>
        <p className="mt-2">For questions, contact us at +234 800 123 4567</p>
      </div>
    </section>
  )
}
