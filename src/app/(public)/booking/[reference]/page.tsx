import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Calendar, CreditCard, Users, BedDouble, MapPin, XCircle, CheckCircle, Clock } from "lucide-react"
import { getBookingByReference, cancelBooking } from "@/app/actions/booking-actions"

interface Props {
  params: Promise<{ reference: string }>
  searchParams: Promise<{ email?: string }>
}

export default async function BookingDetailPage({ params, searchParams }: Props) {
  const { reference } = await params
  const { email } = await searchParams

  if (!email) redirect("/booking")

  const reservation = await getBookingByReference(email, reference)

  if (!reservation) {
    return (
      <section className="pt-40 pb-32 px-6 md:px-16 max-w-[600px] mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="font-heading text-3xl mb-3">Booking Not Found</h1>
        <p className="text-white/50 mb-8">We couldn&apos;t find a booking matching the provided email and reference.</p>
        <Link href="/booking" className="px-8 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#F3E5AB] transition-all">
          Try Again
        </Link>
      </section>
    )
  }

  const statusColor = {
    PENDING: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    CONFIRMED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    CHECKED_IN: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    CHECKED_OUT: "text-gray-400 bg-gray-400/10 border-gray-400/20",
    CANCELLED: "text-red-400 bg-red-400/10 border-red-400/20",
    NO_SHOW: "text-red-400 bg-red-400/10 border-red-400/20",
  }[reservation.status] || "text-white/50 bg-white/5 border-white/10"

  const canCancel = !["CHECKED_IN", "CHECKED_OUT", "CANCELLED"].includes(reservation.status)

  return (
    <section className="pt-40 pb-32 px-6 md:px-16 max-w-[800px] mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl tracking-tight mb-2">Booking Details</h1>
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border ${statusColor}`}>
          {reservation.status === "CONFIRMED" && <CheckCircle className="w-4 h-4" />}
          {reservation.status === "PENDING" && <Clock className="w-4 h-4" />}
          {reservation.status === "CANCELLED" && <XCircle className="w-4 h-4" />}
          {reservation.status}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 space-y-6">
        {/* Reference */}
        <div className="text-center bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Booking Reference</p>
          <p className="text-2xl font-bold text-[#D4AF37] tracking-wider">{reservation.bookingReference}</p>
        </div>

        {/* Room Info */}
        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
            <BedDouble className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <p className="font-bold">{reservation.room.roomType.name}</p>
            <p className="text-white/50 text-sm">Room {reservation.room.number}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Guest</span>
            <span className="font-medium">{reservation.guest.firstName} {reservation.guest.lastName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Email</span>
            <span className="font-medium">{reservation.guest.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Phone</span>
            <span className="font-medium">{reservation.guest.phone}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3" /> Check-in</span>
            <span className="font-medium">{new Date(reservation.checkIn).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3" /> Check-out</span>
            <span className="font-medium">{new Date(reservation.checkOut).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50 flex items-center gap-1"><Users className="w-3 h-3" /> Guests</span>
            <span className="font-medium">{reservation.adults} Adult{reservation.adults > 1 ? "s" : ""}{reservation.children > 0 ? `, ${reservation.children} Child${reservation.children > 1 ? "ren" : ""}` : ""}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Duration</span>
            <span className="font-medium">{reservation.nights} night{reservation.nights > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Extras */}
        {reservation.extras.length > 0 && (
          <>
            <div className="h-px bg-white/10" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Extras</p>
              {reservation.extras.map((extra) => (
                <div key={extra.id} className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">{extra.name} × {extra.quantity}</span>
                  <span className="font-medium">₦{(extra.price * extra.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Price Breakdown */}
        <div className="h-px bg-white/10" />
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Room Price</span>
            <span>₦{reservation.roomPrice.toLocaleString()}</span>
          </div>
          {reservation.extrasAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Extras</span>
              <span>₦{reservation.extrasAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Tax</span>
            <span>₦{reservation.taxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Service Charge</span>
            <span>₦{reservation.serviceCharge.toLocaleString()}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-[#D4AF37]">₦{reservation.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</span>
            <span className={`font-bold ${reservation.paymentStatus === "PAID" ? "text-emerald-400" : "text-amber-400"}`}>
              {reservation.paymentStatus}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="h-px bg-white/10" />
        <div className="flex flex-col sm:flex-row gap-3">
          {reservation.paymentStatus === "UNPAID" && reservation.status !== "CANCELLED" && (
            <Link
              href={`/api/paystack/initialize?reservationId=${reservation.id}`}
              className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-sm text-center hover:bg-[#F3E5AB] transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Pay Now
            </Link>
          )}
          {canCancel && (
            <form action={async () => {
              "use server"
              await cancelBooking(reference)
              redirect(`/booking/${reference}?email=${email}`)
            }}>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-bold uppercase tracking-wider text-sm text-center hover:bg-red-500/20 transition-all border border-red-500/20 flex items-center justify-center gap-2 px-6"
              >
                <XCircle className="w-4 h-4" /> Cancel Booking
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
