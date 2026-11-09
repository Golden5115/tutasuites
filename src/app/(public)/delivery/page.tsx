import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { 
  Bike, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Star, 
  Users, 
  FileText, 
  Package, 
  Utensils, 
  Shirt, 
  ShoppingCart, 
  Pill, 
  Gift, 
  Building2, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  PhoneCall,
  Smartphone,
  Download,
  QrCode,
  Zap,
  Navigation
} from "lucide-react"

import { DeliveryServiceAreaCard } from "@/components/delivery/delivery-service-area-card"

export const metadata: Metadata = {
  title: "Tuta Mobile App | Order Meals & Track Deliveries in Mowe, Magboro & Beyond",
  description: "Download the Tuta Mobile Application (Chowdeck & Glovo style). Order hot restaurant meals, send packages, and track dispatch riders in real-time across Mowe, Magboro, Ibafo, OPIC & Sagamu. Call/WhatsApp 07075733866.",
  keywords: [
    "Tuta Mobile App",
    "Food delivery app Mowe",
    "Chowdeck Mowe",
    "Glovo Magboro",
    "Tuta Courier Service",
    "Dispatch rider app Mowe",
    "Food ordering app Ogun State",
  ],
  openGraph: {
    title: "Tuta Mobile App | Food Ordering & Courier Dispatch",
    description: "Order fresh meals from Tuta Restaurant and send packages with real-time tracking. Download now.",
    images: ["/courier-rider.png"],
  },
}

const APP_FEATURES = [
  {
    icon: Utensils,
    title: "Order Hot Restaurant Meals",
    desc: "Browse our complete in-house menu: Jollof rice, Fried rice, Egusi soup, Catfish pepper soup, Grilled turkey, and chilled cocktails delivered in insulated thermal bags.",
    badge: "25–35 mins delivery",
  },
  {
    icon: Navigation,
    title: "Real-Time Live Order Tracking",
    desc: "Watch your order in real time! See when the kitchen accepts it, when chef finishes cooking, and track your dispatch rider on the live corridor map right to your gate.",
    badge: "Chowdeck / Glovo Style",
  },
  {
    icon: Zap,
    title: "Precise Time Estimation",
    desc: "Know exactly when your food or parcel arrives. Live countdown timer keeps you informed every minute so you can relax without anxiety.",
    badge: "Live ETA Countdown",
  },
  {
    icon: Bike,
    title: "Tuta Courier — Send Anything",
    desc: "Need to send documents, laundry, groceries, or gifts? Use the 'Send Package' tab to dispatch riders anywhere across Mowe, Magboro, Ibafo & beyond.",
    badge: "Anywhere in Mowe",
  },
]

const SERVICES = [
  { icon: FileText, title: "Document Delivery", desc: "Urgent contracts, bank tokens & confidential papers." },
  { icon: Package, title: "Package Delivery", desc: "Parcels, merchandise, gadgets & personal care." },
  { icon: Utensils, title: "Food Delivery", desc: "Fresh hot meals from Tuta Restaurant & local spots." },
  { icon: Shirt, title: "Laundry Pick & Drop", desc: "Doorstep pickup for Tuta professional laundry." },
  { icon: ShoppingCart, title: "Shopping & Errands", desc: "Grocery runs, supermarket pickups & market errands." },
  { icon: Pill, title: "Pharmacy Pick Up", desc: "Urgent medical prescriptions & wellness supplies." },
  { icon: Gift, title: "Gifts & Surprises", desc: "Carefully handled birthday parcels, cakes & gifts." },
  { icon: Building2, title: "Business Deliveries", desc: "Bulk corporate dispatch & scheduled merchant routes." },
]

export default function DeliveryPage() {
  return (
    <div className="pt-28 md:pt-36 pb-20 px-6 md:px-16 max-w-[1500px] mx-auto text-white">
      {/* ── Hero App Showcase Section ── */}
      <section className="relative mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Text, App Store Badges, Hotline (7 cols) */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold tracking-widest uppercase mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>📱 The Official Tuta Mobile Application • Coming Soon</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.08] mb-6">
              Order Food & <br />
              <span className="text-[#D4AF37]">Track in Real-Time</span>
            </h1>

            <p className="text-xl sm:text-2xl font-light text-white/90 mb-4 tracking-wide">
              Like Chowdeck & Glovo — Crafted for Mowe, Magboro & Beyond.
            </p>

            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
              Craving fresh meals from Tuta Suites Restaurant or sending important packages? With the upcoming <strong className="text-white">Tuta Mobile App (Coming Soon)</strong>, you will be able to customize your dishes, estimate arrival time, and track your dispatch rider live on the map until it arrives at your doorstep. In the meantime, order instantly via our WhatsApp &amp; phone hotline!
            </p>

            {/* App Store / Download Action Strip */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <a
                href="#download"
                className="px-8 py-4 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-extrabold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Get Mobile App (Coming Soon)</span>
              </a>

              <a
                href="https://wa.me/2347075733866?text=Hello%20Tuta%20Suites,%20I%20would%20like%20to%20order%20food%20/%20courier%20delivery."
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <Bike className="w-4 h-4" />
                <span>WhatsApp: 07075733866</span>
              </a>

              <a
                href="tel:07075733866"
                className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Call Hotline</span>
              </a>
            </div>

            {/* Key Value Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="font-medium">25–35m Arrival</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Live Map GPS</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Thermal Insulated</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="font-medium">Local & Trusted</span>
              </div>
            </div>
          </div>

          {/* Right: Realistic Mobile App Mockup Visual (5 cols) */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Phone Frame */}
            <div className="w-[310px] sm:w-[340px] rounded-[48px] p-3 bg-gradient-to-b from-[#2a2a35] via-[#15151c] to-[#0d0d12] border-4 border-white/20 shadow-2xl relative shadow-black/80">
              {/* Dynamic Island / Speaker Notch */}
              <div className="w-28 h-5 bg-black rounded-full mx-auto mb-3 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white/10 mr-2" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Screen Mockup Inner */}
              <div className="bg-[#0A0A0E] rounded-[36px] overflow-hidden p-4 space-y-4 border border-white/10">
                {/* Header Mockup */}
                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase text-[#D4AF37] tracking-wider">DELIVER TO</p>
                    <p className="font-bold text-white text-xs truncate max-w-[150px]">📍 Mowe, Assurance CDA</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    ⚡ 25-35m
                  </span>
                </div>

                {/* Hero Meal Banner Mockup */}
                <div className="relative h-28 rounded-2xl overflow-hidden border border-[#D4AF37]/30">
                  <Image src="/courier-rider.png" alt="Rider" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[9px] font-black uppercase text-[#D4AF37]">TUTA MOBILE APP • COMING SOON</span>
                    <p className="text-xs font-bold text-white">Live Food & Courier Tracking</p>
                  </div>
                </div>

                {/* Order In Progress Tracking Card Mockup */}
                <div className="p-3 rounded-xl bg-[#121217] border border-[#D4AF37]/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-extrabold text-[#D4AF37]">LIVE DISPATCH</span>
                    <span className="text-[10px] text-emerald-400 font-bold">⚡ 18 mins ETA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏍</span>
                    <div>
                      <p className="text-xs font-bold text-white">Rider Babatunde is on the way</p>
                      <p className="text-[10px] text-white/50">Mowe Expressway • Plate OGN-842-KT</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex gap-1">
                    <div className="w-1/4 bg-emerald-400" />
                    <div className="w-1/4 bg-emerald-400" />
                    <div className="w-1/4 bg-[#D4AF37]" />
                    <div className="w-1/4 bg-white/10" />
                  </div>
                </div>

                {/* Menu Item Mockup */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Special Jollof &amp; Plantain</p>
                    <p className="text-[10px] text-white/50">Firewood-smoked with dodo</p>
                    <p className="text-[11px] font-semibold text-emerald-400 mt-1">Available to Order</p>
                  </div>
                  <span className="px-3 py-1 bg-[#D4AF37] text-black text-[10px] font-black rounded-lg">
                    + Add
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: App Features Breakdown (Chowdeck & Glovo Experience) ── */}
      <section className="mb-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2 block">
            Why Use The Mobile Application? • Coming Soon
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl text-white mb-4">
            Everything You Love About Food Apps
          </h2>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Our dedicated mobile application is currently in development! While it is being finalized for Google Play and the Apple App Store, you can explore the upcoming features below and place instant delivery orders right away via our WhatsApp hotline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {APP_FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="p-6 rounded-2xl bg-[#111115] border border-white/10 hover:border-[#D4AF37]/40 transition-all duration-300 flex flex-col justify-between group hover:bg-[#15151b]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] transition-colors">
                    <feat.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="font-heading text-xl text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Download / Access the App (Expo & Mobile) ── */}
      <section id="download" className="mb-24 scroll-mt-28">
        <div className="bg-gradient-to-r from-[#121217] via-[#0b2014] to-[#121217] border border-[#D4AF37]/40 rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-2 block">
                Mobile App • In Development (Coming Soon)
              </span>
              <h2 className="font-heading text-3xl sm:text-5xl text-white mb-4">
                Mobile App Launching Soon
              </h2>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-8">
                We are actively developing the Tuta Mobile App for iOS and Android to bring you a lightning-fast Chowdeck &amp; Glovo-style food ordering and courier experience across Mowe, Magboro, Ibafo &amp; beyond.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">App Stores Launch (Coming Soon)</h4>
                    <p className="text-xs text-white/50">Will be available soon for free on Google Play Store and Apple App Store.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Tracking &amp; Meal Customizer</h4>
                    <p className="text-xs text-white/50">Select proteins, choose sides, estimate delivery duration, and watch your rider navigate live to your door.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-black font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Instant WhatsApp Ordering Active Today</h4>
                    <p className="text-xs text-white/50">While we complete the mobile application, our riders are ready to dispatch your food and parcels immediately via WhatsApp or phone call.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Card Graphic */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider mb-4">
                In Active Development • Coming Soon
              </div>
              <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center mb-4">
                <Smartphone className="w-10 h-10" />
              </div>
              <h3 className="font-heading text-xl text-white mb-2">Tuta Mobile App</h3>
              <p className="text-xs text-white/60 mb-6">
                Be the first to know when the mobile application officially goes live on Google Play &amp; App Store.
              </p>

              <a
                href="https://wa.me/2347075733866?text=Hello%20Tuta%20Suites,%20please%20notify%20me%20when%20the%20mobile%20app%20launches!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#D4AF37]/20"
              >
                Notify Me On Launch (Coming Soon)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Digital Flyer Information & Service Areas ── */}
      <section className="mb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2 block">
            Coverage &amp; Destinations
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-white">
            Delivery Locations &amp; Corridor Coverage
          </h2>
          <p className="text-xs text-white/60 mt-2">
            Coverage areas and corridor dispatch hubs within Mowe – Magboro and environs. Contact dispatch for custom parcel quotes.
          </p>
        </div>

        <DeliveryServiceAreaCard />
      </section>

      {/* ── Section: The 8 Courier Categories ── */}
      <section className="mb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2 block">
            Pick Up • Delivery • With Care
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-white">
            Our 8 Delivery Offerings
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SERVICES.map((srv) => (
            <div key={srv.title} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mx-auto mb-3">
                <srv.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h4 className="font-bold text-white text-sm mb-1">{srv.title}</h4>
              <p className="text-[11px] text-white/50">{srv.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom Hotline Strip ── */}
      <section className="bg-gradient-to-r from-[#17171d] via-[#102416] to-[#17171d] border border-[#D4AF37]/40 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto relative z-10">
          <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-2">
            TRACK. RELAX. WE DELIVER.
          </p>
          <h2 className="font-heading text-3xl sm:text-5xl text-white mb-4">
            Need Direct Phone Assistance?
          </h2>
          <p className="text-white/70 text-sm sm:text-base mb-8">
            Prefer to call or send a quick WhatsApp message? Our central dispatch desk at No 3 Assurance CDA is active 7 days a week.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:07075733866"
              className="px-8 py-4 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-extrabold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 07075733866</span>
            </a>

            <a
              href="https://wa.me/2347075733866?text=Hello%20Tuta%20Suites,%20I%20would%20like%20to%20order%20meals%20/%20courier."
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <Bike className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
