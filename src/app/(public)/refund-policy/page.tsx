import Link from "next/link"

export default function RefundPolicyPage() {
  return (
    <div className="pt-32 pb-20 px-6 md:px-16 max-w-4xl mx-auto text-white/80">
      <h1 className="text-4xl font-heading text-white mb-8">Refund and Cancellation Policy</h1>
      
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">1. Cancellation by Guest</h2>
          <p>
            Guests may cancel their reservations without penalty up to 48 hours prior to the scheduled check-in time (2:00 PM local time). For cancellations made within 48 hours of the scheduled check-in time, a cancellation fee equivalent to the first night's room rate will be charged.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">2. Non-Refundable Rates</h2>
          <p>
            Certain promotional rates or special offers may be designated as non-refundable. For these reservations, no refunds will be issued under any circumstances, including cancellations, no-shows, or early departures.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">3. No-Shows</h2>
          <p>
            In the event of a no-show (failure to arrive on the scheduled check-in date without prior notification), the entire booking amount will be charged, and the remainder of the reservation will be canceled.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">4. Early Departures</h2>
          <p>
            If you decide to check out earlier than your scheduled departure date, the hotel reserves the right to charge an early departure fee, which may be up to the cost of one night's stay.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">5. Refund Processing</h2>
          <p>
            Eligible refunds will be processed using the original method of payment within 5 to 10 business days. Depending on your bank or payment provider, it may take additional time for the funds to reflect in your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">6. Modifications to Bookings</h2>
          <p>
            Any requests to modify a booking (e.g., changing dates or room type) are subject to availability and may result in a change in the booking rate. Modifications must be requested prior to the standard cancellation window.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-[#D4AF37] hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  )
}
