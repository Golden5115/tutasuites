import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, ChevronRight } from "lucide-react"

export function PublicFooter() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[#0a0a0a] pt-20 pb-10 px-6 md:px-16">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-12">
                <Image 
                  src="/logo.png" 
                  alt="Tuta Suites Logo" 
                  fill 
                  className="object-contain invert"
                />
              </div>
              <span className="text-[12px] font-bold tracking-[0.3em] text-white mt-1">TUTASUITES</span>
            </div>
          </div>
          <p className="text-white/50 text-sm leading-relaxed">
            Redefining luxury hospitality with unparalleled service, exquisite design, and an unwavering commitment to your comfort.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-bold uppercase tracking-[0.2em] text-sm mb-6">Contact Us</h4>
          <div className="space-y-4 text-white/60 text-sm">
            <p className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#D4AF37] mt-1 shrink-0" /> 
              <span>No 3 Owonikoko road, Assurance CDA Estate Orimerunmu Mowe-ibafo</span>
            </p>
            <p className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" /> 
              0811 182 1899
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-[0.2em] text-sm mb-6">Quick Links</h4>
          <div className="flex flex-col space-y-3 text-white/60 text-sm">
            <Link href="/rooms" className="hover:text-[#D4AF37] transition-colors">Our Suites</Link>
            <Link href="/booking" className="hover:text-[#D4AF37] transition-colors">My Booking</Link>
            <a href="/#about" className="hover:text-[#D4AF37] transition-colors">About Us</a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-[0.2em] text-sm mb-6">Newsletter</h4>
          <p className="text-white/50 text-sm mb-4">Subscribe for exclusive offers and updates.</p>
          <div className="flex">
            <input type="email" placeholder="Email Address" className="bg-white/5 border border-white/10 rounded-l-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] w-full" />
            <button className="bg-[#D4AF37] text-black px-4 py-3 rounded-r-lg font-bold">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-[1600px] mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-white/40 text-xs">
        <p>&copy; {new Date().getFullYear()} Tuta Suites. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}
