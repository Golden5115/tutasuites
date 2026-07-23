import Link from "next/link"

export default function TermsAndConditionsPage() {
  return (
    <div className="pt-32 pb-20 px-6 md:px-16 max-w-4xl mx-auto text-white/80">
      <h1 className="text-4xl font-heading text-white mb-8">Terms and Conditions</h1>
      
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing this website and booking a room at Tuta Suites, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">2. Booking and Payment</h2>
          <p>
            All bookings are subject to availability and confirmation. A valid payment method is required to secure your reservation. Full payment or a deposit may be required at the time of booking depending on the rate selected.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">3. Check-In and Check-Out</h2>
          <p>
            Standard check-in time is from 2:00 PM, and check-out time is before 12:00 PM (Noon). Early check-in or late check-out is subject to availability and may incur additional charges.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">4. Guest Responsibilities</h2>
          <p>
            Guests are expected to conduct themselves appropriately at all times and comply with hotel rules. The hotel reserves the right to refuse accommodation or services or remove guests who are causing a disturbance or acting illegally.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">5. Damage to Property</h2>
          <p>
            We reserve the right to charge guests for the cost of rectifying damage caused by the deliberate, negligent, or reckless act of the guest to the hotel's property or structure.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">6. Modifications to Terms</h2>
          <p>
            We reserve the right to change these terms and conditions at any time without prior notice. The updated terms will be effective as soon as they are posted on this website.
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
