import Link from "next/link"

export default function TermsAndConditionsPage() {
  return (
    <div className="pt-32 pb-20 px-6 md:px-16 max-w-4xl mx-auto text-white/80">
      <h1 className="text-4xl font-heading text-white mb-8">Terms and Conditions</h1>
      <p className="mb-8 text-sm text-white/60">Last Updated: July 2026</p>
      
      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">1. Introduction and Agreement</h2>
          <p className="mb-3">
            Welcome to Tuta Suites ("Hotel", "we", "our", or "us"). These Terms and Conditions govern your use of our website, reservation systems, and your stay at our property. 
          </p>
          <p>
            By accessing our website, making a reservation, or checking into our hotel, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions in their entirety. If you do not agree with any part of these terms, you must refrain from using our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">2. Reservations and Booking Policies</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Eligibility:</strong> Guests must be at least 18 years of age and present valid government-issued photo identification upon check-in.</li>
            <li><strong>Accuracy of Information:</strong> You are responsible for ensuring that all details provided during the booking process are accurate. The Hotel is not liable for issues arising from incorrect information.</li>
            <li><strong>Confirmation:</strong> A reservation is only confirmed once a booking reference is generated and a valid payment or deposit is successfully processed.</li>
            <li><strong>Right to Refuse:</strong> We reserve the right to refuse any booking or cancel any reservation at our sole discretion, including in cases of suspected fraud or breach of these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">3. Payments, Rates, and Fees</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Currency:</strong> All rates are quoted in Nigerian Naira (NGN) unless otherwise specified.</li>
            <li><strong>Taxes:</strong> Room rates are subject to applicable local taxes and service charges, which will be detailed during checkout.</li>
            <li><strong>Payment Methods:</strong> We accept major credit/debit cards, bank transfers, and cash. A valid credit card may be required on file at check-in for incidental charges.</li>
            <li><strong>Deposits:</strong> Depending on the rate selected, a deposit or full upfront payment may be required to secure the reservation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">4. Check-In and Check-Out Policies</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Check-In:</strong> Standard check-in time is 2:00 PM. Early check-in is subject to availability and may incur an additional fee.</li>
            <li><strong>Check-Out:</strong> Standard check-out time is 12:00 PM (Noon). Late check-outs must be arranged with the front desk in advance and may incur additional charges. If a guest fails to check out on time, the Hotel reserves the right to charge for an additional night.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">5. Guest Conduct and Responsibilities</h2>
          <p className="mb-3">
            We strive to provide a safe and peaceful environment for all our guests. By staying at Tuta Suites, you agree to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Respect the peace and privacy of other guests. Excessive noise or disruptive behavior will not be tolerated.</li>
            <li>Comply with all health and safety regulations posted within the property.</li>
            <li>Refrain from smoking in non-smoking rooms or indoor public areas. A cleaning fee will be charged for violations.</li>
            <li>Not bring pets onto the premises unless explicitly permitted by prior written arrangement.</li>
          </ul>
          <p className="mt-3">
            The Hotel reserves the right to immediately terminate the stay of any guest whose conduct violates these rules, without refund.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">6. Damage to Hotel Property</h2>
          <p>
            Guests are fully responsible for any damage, loss, or destruction caused to the Hotel's property, rooms, fixtures, or furnishings by themselves or their visitors. The Hotel reserves the right to charge the guest's payment method on file for the full cost of repair, replacement, or specialized cleaning required.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">7. Liability and Disclaimers</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Personal Property:</strong> The Hotel is not liable for the loss, theft, or damage of personal belongings, valuables, or vehicles brought onto the premises. Safes are provided in rooms for securing valuables.</li>
            <li><strong>Force Majeure:</strong> The Hotel accepts no liability and will not pay any compensation where the performance of its obligations is prevented or affected by events beyond its reasonable control, including but not limited to natural disasters, acts of terrorism, civil unrest, or utility failures.</li>
            <li><strong>Limitation of Liability:</strong> To the maximum extent permitted by law, our total liability to you for any claim arising out of your stay shall not exceed the total amount paid for your reservation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">8. Privacy and Data Protection</h2>
          <p>
            We respect your privacy. Any personal information collected during the booking process or your stay will be processed in accordance with our Privacy Policy. By using our services, you consent to such processing.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">9. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms and Conditions shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Nigeria.
          </p>
        </section>
      </div>

      <div className="mt-16 border-t border-white/10 pt-8">
        <Link href="/" className="text-[#D4AF37] hover:underline flex items-center gap-2 w-fit">
          <span>&larr;</span> Back to Home
        </Link>
      </div>
    </div>
  )
}
