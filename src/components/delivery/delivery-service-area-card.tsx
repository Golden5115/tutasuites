"use client"

import { useState } from "react"
import { DELIVERY_LOCATIONS } from "@/lib/delivery-constants"
import { 
  MapPin, 
  Search, 
  ShieldCheck, 
  Clock, 
  Star, 
  Users, 
  Sparkles, 
  CheckCircle,
  ExternalLink,
  Compass
} from "lucide-react"

export function DeliveryServiceAreaCard() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLocations = DELIVERY_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.landmarks.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-12">
      {/* Top Banner: Headquarters & Service Radius */}
      <div className="bg-gradient-to-r from-[#0d1f14] via-[#111115] to-[#0d1f14] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-4">
              <Compass className="w-3.5 h-3.5" />
              <span>Coverage Hub & Dispatch Base</span>
            </div>
            <h3 className="font-heading text-3xl sm:text-4xl text-white mb-3">
              Mowe – Magboro & Beyond
            </h3>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6">
              Strategically headquartered at Tuta Suites in Orimerunmu/Owonikoko, our motorized dispatch fleet seamlessly connects commercial hubs, residential estates, schools, and markets along the Lagos-Ibadan Expressway corridor.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 bg-white/5 border border-white/10 p-4 rounded-2xl">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span className="font-semibold text-white">Central Hub Address:</span>
              <span className="text-white/70">No 3 Assurance CDA off Owonikoko, Orimerunmu, Mowe-Magboro, Ogun State</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
              Dispatch Hotlines
            </p>
            <p className="text-2xl font-bold font-mono text-white mb-2">07075733866</p>
            <p className="text-[11px] text-white/50 mb-4">Available for direct calls & WhatsApp bookings</p>
            <a
              href="https://wa.me/2347075733866?text=Hello%20Tuta%20Courier,%20I%20need%20a%20delivery%20pickup."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-950/40"
            >
              <span>Chat With Dispatcher</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Visual Corridor Map + Rate Card Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Corridor Route Nodes (7 cols) */}
        <div className="lg:col-span-7 bg-[#111113] border border-white/10 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h4 className="font-heading text-2xl text-white">Delivery Corridor Nodes</h4>
              <p className="text-xs text-white/50">Primary route checkpoints & delivery hubs</p>
            </div>
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              11 Hubs Active
            </span>
          </div>

          {/* Visual Corridor Roadmap */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "Mowe Hub", tag: "Primary Central Hub", landmarks: "Mowe Bus Stop, Owonikoko, Nestle, Assurance CDA", badge: "Fastest 15-25m" },
                { name: "Magboro", tag: "Market & Residential", landmarks: "Magboro Market, Underbridge, Gasline, Estates", badge: "35-50m" },
                { name: "Ibafo", tag: "Transit Hub", landmarks: "Ibafo Market, Police Station, Express Junction", badge: "30-45m" },
                { name: "Arepo", tag: "Prime Residential", landmarks: "Arepo Junction, Journalists Estate, Citiview", badge: "40-55m" },
                { name: "OPIC & Wawa", tag: "Lagos Border Corridors", landmarks: "OPIC Plaza, Long Bridge, Riverview, Berger link", badge: "45-60m" },
                { name: "Asese & Lotto", tag: "Express Axis", landmarks: "Lotto Bus Stop, Asese Junction, Camp Axis", badge: "25-40m" },
                { name: "Olowotedo & Christ Embassy", tag: "Community & Camp", landmarks: "Olowotedo Market, Camp Ground Axis", badge: "25-40m" },
                { name: "Sagamu Express", tag: "Intercity Reach", landmarks: "Sagamu Interchange, Remo Axis, NYSC Road", badge: "50-75m" },
              ].map((corridor, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#D4AF37]/30 transition-all hover:bg-white/[0.04] group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white text-sm group-hover:text-[#D4AF37] transition-colors">
                      {corridor.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                      {corridor.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mb-2">{corridor.landmarks}</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                    <span className="text-white/40">{corridor.tag}</span>
                    <span className="font-semibold text-emerald-400 text-[11px]">Active Route</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-white/[0.01] border border-dashed border-white/15 text-center text-xs text-white/50">
              ✨ <strong className="text-white">More Locations Coming Soon!</strong> Expanding to Berger, Isheri, Kara, and Ibadan highway axis.
            </div>
          </div>
        </div>

        {/* Right: Digital Rate Card Table (5 cols) - Mirroring Flyer Back */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#18181c] to-[#111114] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#D4AF37]">
                Coverage Directory
              </span>
              <h4 className="font-heading text-2xl text-white">Delivery Locations &amp; Hubs</h4>
            </div>
          </div>
          <p className="text-xs text-white/60 mb-6">
            Active delivery destinations within Mowe – Magboro and environs. Contact dispatch hotline or WhatsApp for custom parcel quotes.
          </p>

          {/* Search Box */}
          <div className="relative mb-4">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search town or landmark..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Table */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredLocations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/20 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <div>
                    <p className="text-xs font-bold text-white">{loc.name}</p>
                    <p className="text-[10px] text-white/40 truncate max-w-[140px] sm:max-w-[180px]">
                      {loc.landmarks[0]}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active Hub
                  </span>
                  <p className="text-[10px] text-white/40 mt-1">⏱ {loc.estimatedTime}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Core Trust Badges (Flyer Footer) */}
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-3 text-[11px] text-white/70">
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
    </div>
  )
}
