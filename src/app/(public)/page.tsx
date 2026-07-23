import Image from "next/image"
import Link from "next/link"
import { Calendar, ChevronRight, Star, Wifi, Utensils, ShieldCheck, Sparkles, Clock, MapPin, Phone, Mail, Shirt } from "lucide-react"
import { HeroCarousel } from "@/components/hero-carousel"
import { SearchForm } from "@/components/search-form"
import { prisma } from "@/lib/prisma"

const AMENITIES = [
  { icon: Wifi, title: "High-Speed WiFi", desc: "Complimentary premium internet access throughout the property." },
  { icon: Utensils, title: "Fine Dining", desc: "In-house restaurant serving local and continental cuisine." },
  { icon: ShieldCheck, title: "24/7 Security", desc: "Round-the-clock surveillance and professional security personnel." },
  { icon: Sparkles, title: "Daily Housekeeping", desc: "Meticulous room cleaning and fresh linen every day." },
  { icon: Clock, title: "Room Service", desc: "Order from our full menu, delivered to your door anytime." },
  { icon: Shirt, title: "Laundry Service", desc: "Professional laundry and dry-cleaning with same-day turnaround." },
]

const TESTIMONIALS = [
  {
    name: "Adebayo Johnson",
    role: "Business Traveller",
    text: "Tuta Suites exceeded every expectation. The rooms are immaculate, the staff is incredibly professional, and the overall ambience is truly world-class. I'll definitely be returning.",
    rating: 5,
  },
  {
    name: "Chidinma Okafor",
    role: "Vacationer",
    text: "From the moment we checked in, we felt like royalty. The attention to detail is remarkable — from the décor to the dining. A hidden gem of luxury.",
    rating: 5,
  },
  {
    name: "Emeka Nwosu",
    role: "Event Guest",
    text: "We hosted a private dinner at Tuta Suites and it was flawless. The team went above and beyond to ensure everything was perfect. Highly recommended.",
    rating: 5,
  },
]

export default async function LandingPage() {
  const roomTypes = await prisma.roomType.findMany({
    orderBy: { basePrice: 'desc' },
  })

  return (
    <>
      {/* Hero Section */}
      <header className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <HeroCarousel>
          <SearchForm />
        </HeroCarousel>
      </header>

      {/* About Section */}
      <section id="about" className="py-16 md:py-32 px-6 md:px-16 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-square md:aspect-[4/5] w-full rounded-3xl overflow-hidden group">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
            <Image 
              src="/dsc_0996.jpg" 
              alt="Luxury suite interior" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105" 
            />
          </div>
          
          <div>
            <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-6">Our Story</h2>
            <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-tight mb-8 leading-[1.1]">
              Where comfort meets class, and every stay feels like home.
            </h3>
            <p className="text-white/70 text-lg md:text-xl font-light leading-relaxed mb-10">
              Tuta Suites is a premier hospitality destination designed for discerning guests who value luxury, privacy, and exceptional service. From elegantly furnished suites to world-class amenities, every detail has been thoughtfully curated to deliver an experience that goes beyond accommodation — it's a lifestyle. Whether you're here for business, leisure, or a special occasion, Tuta Suites is your sanctuary of sophistication.
            </p>
            
            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
              <div>
                <p className="text-4xl font-heading text-white mb-2">24/7</p>
                <p className="text-sm text-white/50 uppercase tracking-widest font-bold">Concierge Service</p>
              </div>
              <div>
                <p className="text-4xl font-heading text-white mb-2">5-Star</p>
                <p className="text-sm text-white/50 uppercase tracking-widest font-bold">Luxury Amenities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Tuta Experience Section ── */}
      <section id="experience" className="py-16 md:py-32 px-6 md:px-16 bg-[#0d0d0d]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4">The Tuta Experience</h2>
            <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-tight max-w-4xl mx-auto leading-[1.1]">
              More than a stay — it's a complete experience.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Luxury Suites */}
            <Link href="/rooms" className="group p-10 rounded-3xl border border-white/[0.06] hover:border-[#D4AF37]/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 flex flex-col items-center text-center">
              <span className="text-[#D4AF37]/30 font-heading text-6xl font-medium mb-4">01</span>
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 flex items-center justify-center mb-6 transition-colors duration-500">
                <Star className="w-8 h-8 text-[#D4AF37]" strokeWidth={1.5} />
              </div>
              <h4 className="font-heading text-2xl md:text-3xl text-white mb-4">Luxury Suites</h4>
              <p className="text-white/50 text-sm leading-relaxed mb-6">Spacious, elegantly furnished rooms designed for ultimate relaxation and privacy.</p>
              <span className="inline-flex items-center gap-2 text-[#D4AF37] text-sm font-bold uppercase tracking-wider mt-auto group-hover:gap-3 transition-all duration-300">
                Explore Rooms <ChevronRight className="w-4 h-4" />
              </span>
            </Link>

            {/* Restaurant & Bar */}
            <div className="group p-10 rounded-3xl border border-white/[0.06] hover:border-[#D4AF37]/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 flex flex-col items-center text-center">
              <span className="text-[#D4AF37]/30 font-heading text-6xl font-medium mb-4">02</span>
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 flex items-center justify-center mb-6 transition-colors duration-500">
                <Utensils className="w-8 h-8 text-[#D4AF37]" strokeWidth={1.5} />
              </div>
              <h4 className="font-heading text-2xl md:text-3xl text-white mb-4">Restaurant & Bar</h4>
              <p className="text-white/50 text-sm leading-relaxed">Savour exquisite local and continental dishes, paired with premium drinks at our in-house lounge.</p>
            </div>

            {/* Laundry & Concierge */}
            <div className="group p-10 rounded-3xl border border-white/[0.06] hover:border-[#D4AF37]/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 flex flex-col items-center text-center">
              <span className="text-[#D4AF37]/30 font-heading text-6xl font-medium mb-4">03</span>
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 flex items-center justify-center mb-6 transition-colors duration-500">
                <Shirt className="w-8 h-8 text-[#D4AF37]" strokeWidth={1.5} />
              </div>
              <h4 className="font-heading text-2xl md:text-3xl text-white mb-4">Laundry & Concierge</h4>
              <p className="text-white/50 text-sm leading-relaxed">Professional laundry services and a dedicated concierge to handle every request, big or small.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Amenities & Services Section ── */}
      <section id="amenities" className="py-16 md:py-32 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Image */}
            <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <Image
                src="/dsc_1025.jpg"
                alt="Tuta Suites amenities"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Right: Content */}
            <div>
              <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4">Amenities & Services</h2>
              <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-tight mb-14 leading-[1.1]">
                Everything you need, nothing you don't.
              </h3>

              <div className="space-y-0">
                {AMENITIES.map((item, i) => (
                  <div
                    key={item.title}
                    className="group/item flex items-start gap-6 py-6 border-b border-white/[0.06] last:border-b-0 hover:border-[#D4AF37]/20 transition-colors duration-300"
                  >
                    <span className="text-[#D4AF37]/20 font-heading text-3xl font-medium leading-none mt-1 w-8 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="w-11 h-11 rounded-lg bg-white/[0.04] group-hover/item:bg-[#D4AF37]/10 flex items-center justify-center shrink-0 transition-colors duration-300">
                      <item.icon className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-white mb-1 tracking-tight">{item.title}</h4>
                      <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section id="testimonials" className="py-16 md:py-32 px-6 md:px-16 bg-[#0d0d0d]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4">Guest Reviews</h2>
            <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-tight max-w-3xl mx-auto">
              What our guests are saying.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col"
              >
                <div className="flex items-center gap-1 mb-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-white/80 text-lg font-light leading-relaxed mb-8 flex-1 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="border-t border-white/10 pt-6">
                  <p className="text-white font-bold tracking-tight">{t.name}</p>
                  <p className="text-white/40 text-sm">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call-to-Action Banner ── */}
      <section className="relative py-24 md:py-40 px-6 md:px-16 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/dsc_1032.jpg" alt="Book your stay" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4">Ready to Experience Luxury?</h2>
          <h3 className="font-heading text-4xl md:text-5xl lg:text-7xl tracking-tight mb-8 leading-[1.1]">
            Book your perfect stay today.
          </h3>
          <p className="text-white/70 text-lg md:text-xl font-light mb-12 max-w-xl mx-auto">
            Whether it's a weekend getaway or an extended retreat, Tuta Suites is ready to welcome you with open arms.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-3 px-10 py-4 bg-[#D4AF37] text-black text-[15px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 hover:bg-[#F3E5AB] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:-translate-y-0.5"
            >
              Browse Suites
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a
              href="tel:08111821899"
              className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-white/30 text-white text-[15px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 hover:border-white/60 hover:-translate-y-0.5"
            >
              <Phone className="w-5 h-5" strokeWidth={1.5} />
              Call Us
            </a>
          </div>
        </div>
      </section>

      {/* ── Location & Contact Section ── */}
      <section id="location" className="py-16 md:py-32 px-6 md:px-16 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4">Find Us</h2>
            <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-tight mb-10 leading-[1.1]">
              Your destination awaits.
            </h3>

            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Address</h4>
                  <p className="text-white/60 text-sm leading-relaxed">No 3 Owonikoko Road, Assurance CDA Estate,<br />Orimerunmu, Mowe-Ibafo, Ogun State</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Phone</h4>
                  <a href="tel:08111821899" className="text-white/60 text-sm hover:text-[#D4AF37] transition-colors">0811 182 1899</a>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Email</h4>
                  <a href="mailto:info@tutasuites.com" className="text-white/60 text-sm hover:text-[#D4AF37] transition-colors">info@tutasuites.com</a>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Check-in / Check-out</h4>
                  <p className="text-white/60 text-sm">Check-in from 2:00 PM · Check-out by 12:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.06]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.8!2d3.39!3d6.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNDUnMDAuMCJOIDPCsDIzJzI0LjAiRQ!5e0!3m2!1sen!2sng!4v1"
              className="absolute inset-0 w-full h-full border-0 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Tuta Suites Location"
            />
          </div>
        </div>
      </section>
    </>
  )
}
