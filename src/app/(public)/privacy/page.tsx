import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-32 pb-20 px-6 md:px-16 max-w-4xl mx-auto text-white/80">
      <h1 className="text-4xl font-heading text-white mb-8">Privacy Policy</h1>
      
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">1. Information We Collect</h2>
          <p>
            When you make a reservation or use our website, we collect personal information such as your name, email address, phone number, and payment details. We may also collect non-personal information about your visit to our website.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">2. How We Use Your Information</h2>
          <p>
            Your information is used to process your reservations, facilitate your stay, communicate with you regarding your booking, and improve our services. We may also use your email to send promotional offers if you have opted in to receive them.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">3. Payment Processing</h2>
          <p>
            We use secure third-party payment processors (such as Paystack) to handle payments. We do not store your complete credit card or payment data on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">4. Information Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except to trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">5. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-[#D4AF37] font-bold mb-3">6. Contact Us</h2>
          <p>
            If there are any questions regarding this privacy policy, you may contact us using the information on our website.
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
