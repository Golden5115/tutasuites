import { BookingLookupForm } from "@/components/booking-lookup-form"

export default function BookingLookupPage() {
  return (
    <section className="pt-40 pb-32 px-6 md:px-16">
      <div className="max-w-[800px] mx-auto text-center mb-12">
        <h1 className="font-heading text-4xl md:text-5xl tracking-tight mb-3">
          My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF8D6] to-[#D4AF37]">Booking</span>
        </h1>
        <p className="text-white/60 text-lg">View, manage, or cancel your reservation.</p>
      </div>
      <BookingLookupForm />
    </section>
  )
}
