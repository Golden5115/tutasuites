"use client"

import { useState, useTransition } from "react"
import { trackDeliveryOrder } from "@/app/actions/delivery-actions"
import { 
  Search, 
  Package, 
  Bike, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  PhoneCall, 
  AlertCircle,
  Truck,
  ShieldCheck
} from "lucide-react"

export function DeliveryTrackingTool() {
  const [trackingInput, setTrackingInput] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingInput.trim()) return

    startTransition(async () => {
      const res = await trackDeliveryOrder(trackingInput)
      setResult(res)
    })
  }

  const loadSample = (code: string) => {
    setTrackingInput(code)
    startTransition(async () => {
      const res = await trackDeliveryOrder(code)
      setResult(res)
    })
  }

  return (
    <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center justify-center gap-2 mb-2">
          <Truck className="w-4 h-4" />
          <span>Real-Time Parcel Tracking</span>
        </span>
        <h3 className="text-2xl sm:text-3xl font-heading text-white mb-2">
          Track Your Delivery
        </h3>
        <p className="text-white/60 text-sm">
          Enter your Tuta Courier tracking reference (e.g. <span className="font-mono text-white/80">TUTA-DEL-892401</span>) to check the current live dispatch status.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Enter Tracking ID (e.g. TUTA-DEL-892401)"
              className="w-full bg-white/5 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3.5 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
          >
            {isPending ? "Tracking..." : "Track Parcel"}
          </button>
        </form>

        {/* Quick sample suggestions */}
        <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-white/50">
          <span>Try sample:</span>
          <button
            type="button"
            onClick={() => loadSample("TUTA-DEL-892401")}
            className="text-[#D4AF37] hover:underline font-mono"
          >
            TUTA-DEL-892401
          </button>
          <span>or</span>
          <button
            type="button"
            onClick={() => loadSample("TUTA-DEL-741902")}
            className="text-[#D4AF37] hover:underline font-mono"
          >
            TUTA-DEL-741902
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="mt-8 border-t border-white/10 pt-8 max-w-3xl mx-auto">
          {!result.found ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-white/80">{result.message}</p>
              <p className="text-xs text-white/50 mt-2">
                Need help? Call Tuta Courier direct line: <a href="tel:07075733866" className="text-[#D4AF37] font-semibold">07075733866</a>.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-bold text-white tracking-wide">
                      {result.order.trackingNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      result.order.status === "DELIVERED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 animate-pulse"
                    }`}>
                      {result.order.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Item: <span className="text-white/80 font-medium">{result.order.itemDescription}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-white/40">Amount</p>
                  <p className="text-lg font-bold text-[#D4AF37]">₦{result.order.estimatedAmount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Route Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Pickup From</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{result.order.senderName}</p>
                  <p className="text-xs text-white/60">{result.order.senderAddress}, {result.order.senderArea}</p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Drop-Off To</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{result.order.recipientName}</p>
                  <p className="text-xs text-white/60">{result.order.recipientAddress}, {result.order.recipientArea}</p>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8">
                <h4 className="text-xs uppercase tracking-widest font-bold text-white/60 mb-6">
                  Delivery Milestones
                </h4>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                  {result.steps?.map((step: any, idx: number) => (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-6 w-4 h-4 rounded-full border-2 transition-all ${
                          step.done
                            ? "bg-emerald-400 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                            : "bg-[#18181b] border-white/20"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className={`text-sm font-bold ${step.done ? "text-white" : "text-white/40"}`}>
                            {step.title}
                          </h5>
                          {step.done && (
                            <span className="text-[10px] text-emerald-400 font-semibold uppercase">Completed</span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${step.done ? "text-white/60" : "text-white/30"}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Dispatcher Strip */}
              <div className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Bike className="w-5 h-5 text-[#D4AF37]" />
                  <div>
                    <p className="text-xs font-bold text-white">Have questions about this package?</p>
                    <p className="text-[11px] text-white/60">Tuta Courier Dispatch Hotline is active 7 days a week.</p>
                  </div>
                </div>
                <a
                  href="tel:07075733866"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                >
                  Call 07075733866
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
