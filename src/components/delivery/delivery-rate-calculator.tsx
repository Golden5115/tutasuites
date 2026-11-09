"use client"

import { useState, useTransition } from "react"
import { 
  DELIVERY_LOCATIONS, 
  DELIVERY_SERVICES 
} from "@/lib/delivery-constants"
import { 
  calculateDeliveryEstimate 
} from "@/app/actions/delivery-actions"
import { 
  Calculator, 
  Bike, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  PhoneCall, 
  Sparkles,
  PackageCheck
} from "lucide-react"

export function DeliveryRateCalculator() {
  const [pickupId, setPickupId] = useState("mowe")
  const [dropoffId, setDropoffId] = useState("magboro")
  const [serviceId, setServiceId] = useState("package")
  const [packageSize, setPackageSize] = useState<"SMALL" | "MEDIUM" | "LARGE" | "BULK">("MEDIUM")
  
  const [estimate, setEstimate] = useState({
    origin: "Mowe",
    destination: "Magboro",
    service: "Package & Parcel",
    packageSize: "MEDIUM",
    rate: 2200,
    currency: "NGN",
    estimatedTime: "35 - 50 mins",
    originLandmarks: ["Mowe Bus Stop", "Assurance CDA", "Owonikoko", "Orimerunmu"],
    destinationLandmarks: ["Magboro Market", "Underbridge", "Gasline"],
  })

  const [isPending, startTransition] = useTransition()

  const handleCalculate = (
    newPickup = pickupId, 
    newDropoff = dropoffId, 
    newService = serviceId, 
    newSize = packageSize
  ) => {
    startTransition(async () => {
      const res = await calculateDeliveryEstimate(newPickup, newDropoff, newService, newSize)
      setEstimate(res)
    })
  }

  const handlePickupChange = (id: string) => {
    setPickupId(id)
    handleCalculate(id, dropoffId, serviceId, packageSize)
  }

  const handleDropoffChange = (id: string) => {
    setDropoffId(id)
    handleCalculate(pickupId, id, serviceId, packageSize)
  }

  const handleServiceChange = (id: string) => {
    setServiceId(id)
    handleCalculate(pickupId, dropoffId, id, packageSize)
  }

  const handleSizeChange = (size: "SMALL" | "MEDIUM" | "LARGE" | "BULK") => {
    setPackageSize(size)
    handleCalculate(pickupId, dropoffId, serviceId, size)
  }

  const generateWhatsAppEstimateUrl = () => {
    const text = `Hello Tuta Courier!%0A%0AI want to book a delivery with the following estimate:%0A- *Pickup:* ${estimate.origin}%0A- *Drop-off:* ${estimate.destination}%0A- *Service:* ${estimate.service}%0A- *Package Size:* ${estimate.packageSize}%0A- *Estimated Fare:* ₦${estimate.rate.toLocaleString()}%0A%0APlease assign a dispatch rider. Thank you!`
    return `https://wa.me/2347075733866?text=${text}`
  }

  return (
    <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold tracking-widest uppercase mb-1">
              <Calculator className="w-4 h-4" />
              <span>Instant Fare Estimator</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-heading text-white">
              Calculate Your Delivery Rate
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Active Dispatch in Mowe-Magboro Corridor</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls: Left 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 font-semibold mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Pick-Up Hub</span>
                </label>
                <select
                  value={pickupId}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                >
                  {DELIVERY_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-[#18181b] text-white">
                      {loc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-white/40 mt-1.5 truncate">
                  Landmarks: {estimate.originLandmarks?.slice(0, 2).join(", ")}
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 font-semibold mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Drop-Off Destination</span>
                </label>
                <select
                  value={dropoffId}
                  onChange={(e) => handleDropoffChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                >
                  {DELIVERY_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-[#18181b] text-white">
                      {loc.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-white/40 mt-1.5 truncate">
                  Landmarks: {estimate.destinationLandmarks?.slice(0, 2).join(", ")}
                </p>
              </div>
            </div>

            {/* Service Category */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/70 font-semibold mb-2.5">
                Service Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DELIVERY_SERVICES.slice(0, 8).map((srv) => {
                  const isSelected = serviceId === srv.id
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleServiceChange(srv.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/10"
                          : "bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{srv.title.split(" ")[0]}</p>
                      <p className="text-[10px] text-white/50 truncate">{srv.urgency}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Package Size */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/70 font-semibold mb-2.5">
                Package Size / Weight
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "SMALL", label: "Small", sub: "Envelope, Doc" },
                  { id: "MEDIUM", label: "Medium", sub: "Shoebox, Meal" },
                  { id: "LARGE", label: "Large", sub: "Heavy Parcel" },
                  { id: "BULK", label: "Bulk", sub: "Multi-item" },
                ].map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => handleSizeChange(size.id as any)}
                    className={`py-2.5 px-2 rounded-xl text-center border text-xs transition-all ${
                      packageSize === size.id
                        ? "bg-[#D4AF37] text-black border-[#D4AF37] font-bold"
                        : "bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="font-semibold">{size.label}</div>
                    <div className={`text-[10px] ${packageSize === size.id ? "text-black/70" : "text-white/40"}`}>
                      {size.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card: Right 5 cols */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1a1a1f] to-[#121215] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between text-xs text-white/60 mb-4 pb-4 border-b border-white/10">
                <span className="uppercase tracking-widest font-semibold text-[#D4AF37]">Estimated Rate</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {estimate.estimatedTime}
                </span>
              </div>

              <div className="my-4">
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
                  <span className="text-[#D4AF37] font-heading text-3xl font-normal">₦</span>
                  <span>{estimate.rate.toLocaleString()}</span>
                  <span className="text-xs font-normal text-white/50 tracking-normal">estimated</span>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Route: <strong className="text-white">{estimate.origin}</strong> → <strong className="text-white">{estimate.destination}</strong>
                </p>
              </div>

              <div className="space-y-2 py-4 my-4 border-y border-white/10 text-xs text-white/70">
                <div className="flex justify-between py-1">
                  <span className="text-white/40">Category:</span>
                  <span className="text-white font-medium">{estimate.service}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-white/40">Transit Zone:</span>
                  <span className="text-emerald-400 font-medium">Mowe-Magboro Express</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-white/40">Dispatch Mode:</span>
                  <span className="text-white font-medium">Motorcycle Courier Box</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <a
                href={generateWhatsAppEstimateUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/40 hover:-translate-y-0.5"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Instant WhatsApp Dispatch</span>
              </a>

              <a
                href="tel:07075733866"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white font-medium text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Call Hotline: 07075733866</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
