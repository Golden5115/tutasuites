"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { 
  Bike, 
  FileText, 
  Package, 
  Utensils, 
  Shirt, 
  ShoppingCart, 
  Pill, 
  Gift, 
  Building2, 
  ShieldCheck, 
  Clock, 
  Star, 
  Users, 
  ArrowRight, 
  PhoneCall, 
  MapPin, 
  Sparkles,
  ExternalLink
} from "lucide-react"

const SERVICES = [
  { icon: FileText, title: "Document Delivery", desc: "Urgent contracts, bank tokens & confidential papers." },
  { icon: Package, title: "Package Delivery", desc: "Parcels, merchandise, gadgets & personal care." },
  { icon: Utensils, title: "Food Delivery", desc: "Fresh hot meals from Tuta Restaurant & local spots." },
  { icon: Shirt, title: "Laundry Pick & Drop", desc: "Direct doorstep pickup for Tuta professional laundry." },
  { icon: ShoppingCart, title: "Shopping & Errands", desc: "Grocery runs, supermarket pickups & market errands." },
  { icon: Pill, title: "Pharmacy Pick Up", desc: "Urgent medical prescriptions & wellness supplies." },
  { icon: Gift, title: "Gifts & Surprises", desc: "Carefully handled birthday parcels, cakes & gifts." },
  { icon: Building2, title: "Business Deliveries", desc: "Bulk corporate dispatch & scheduled merchant routes." },
]

export function DeliveryHomeSection() {
  const [selectedHub, setSelectedHub] = useState("mowe")

  const quickRates: Record<string, { name: string; time: string }> = {
    mowe: { name: "Mowe Hub", time: "20 - 35 mins" },
    magboro: { name: "Magboro", time: "35 - 50 mins" },
    ibafo: { name: "Ibafo", time: "30 - 45 mins" },
    arepo: { name: "Arepo", time: "40 - 55 mins" },
    opic: { name: "OPIC / Wawa", time: "45 - 60 mins" },
    sagamu: { name: "Sagamu Express", time: "50 - 75 mins" },
  }

  return (
    <section id="courier" className="py-20 md:py-32 px-6 md:px-16 bg-[#08080a] relative overflow-hidden border-t border-b border-white/[0.06]">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-xs font-bold tracking-widest uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>📱 Mobile Application • Coming Soon</span>
            </div>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1]">
              Order Food &amp; Courier On Mobile
            </h2>
            <p className="text-white/60 text-lg md:text-xl font-light mt-3 max-w-2xl">
              Craving fresh meals from Tuta Restaurant or sending packages across <span className="text-[#D4AF37] font-normal">Mowe, Magboro, Ibafo &amp; beyond</span>? Our dedicated mobile application is coming soon — in the meantime, book immediately via WhatsApp or Phone Call!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link
              href="/delivery"
              className="px-7 py-4 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>Mobile App (Coming Soon)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://wa.me/2347075733866?text=Hello%20Tuta%20Courier,%20I%20would%20like%20to%20book%20a%20delivery."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-[0.15em] rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <Bike className="w-4 h-4" />
              <span>WhatsApp: 07075733866</span>
            </a>
          </div>
        </div>

        {/* Feature Grid: Rider Visual Banner + Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          {/* Left: Visual Flyer-Inspired Card (5 cols) */}
          <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-[#D4AF37]/30 bg-gradient-to-br from-[#111116] to-[#0c0c0f] flex flex-col justify-between group min-h-[460px]">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="/courier-rider.png"
                alt="Tuta Courier Dispatch Rider"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-black/40 to-transparent" />
              
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase">
                <Bike className="w-3.5 h-3.5" />
                <span>Motorcycle Dispatch Fleet</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-1">
                  ...We Deliver Convenience
                </p>
                <h3 className="font-heading text-2xl sm:text-3xl text-white mb-3">
                  TRACK. RELAX. WE DELIVER.
                </h3>
                <p className="text-white/65 text-sm leading-relaxed mb-6">
                  Need a hot meal delivered from Tuta Suites Restaurant? Laundry picked up from your home? An urgent legal document or parcel sent across the expressway? Our dedicated courier team handles it with speed and security.
                </p>
              </div>

              {/* 4 Guarantees */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs text-white/75">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Safe & Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>On-Time Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Trusted Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Local & Reliable</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: The 8 Services & Quick Calculator (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 8 Services Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SERVICES.map((s) => (
                <div
                  key={s.title}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.07] hover:border-[#D4AF37]/30 hover:bg-white/[0.04] transition-all group/item"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 group-hover/item:bg-[#D4AF37]/20 flex items-center justify-center mb-3 text-[#D4AF37] transition-colors">
                    <s.icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white mb-1 leading-snug">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-white/45 leading-relaxed hidden sm:block">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Location Fare Card */}
            <div className="bg-gradient-to-r from-[#141418] via-[#101013] to-[#141418] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="w-full sm:w-auto">
                <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Select Destination Hub</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(quickRates).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedHub(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedHub === key
                          ? "bg-[#D4AF37] text-black"
                          : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {quickRates[key].name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-white/10 sm:pl-6 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider">Estimated Transit</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400">⏱ {quickRates[selectedHub]?.time}</p>
                </div>
                <p className="text-[11px] text-white/60 font-medium sm:mt-1">
                  Active Dispatch Corridor
                </p>
              </div>
            </div>

            {/* Bottom Callout Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs sm:text-sm text-white/90">
                  <strong className="text-white">Central Hub:</strong> No 3 Assurance CDA off Owonikoko, Orimerunmu, Mowe-Magboro
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-[#D4AF37]">
                <a href="tel:07075733866" className="hover:underline flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>07075733866</span>
                </a>
                <span className="text-white/20">|</span>
                <span className="text-white/60 font-normal">TUTA Moves With You!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
