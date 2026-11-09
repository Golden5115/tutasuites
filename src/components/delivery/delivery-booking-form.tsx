"use client"

import { useState, useTransition } from "react"
import { 
  DELIVERY_LOCATIONS, 
  DELIVERY_SERVICES 
} from "@/lib/delivery-constants"
import { 
  calculateDeliveryEstimate, 
  createDeliveryRequest 
} from "@/app/actions/delivery-actions"
import { 
  Bike, 
  MapPin, 
  User, 
  Phone, 
  Package, 
  FileText, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Send, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  AlertCircle
} from "lucide-react"

export function DeliveryBookingForm() {
  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    senderArea: "Mowe",
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    recipientArea: "Magboro",
    serviceType: "package",
    packageSize: "MEDIUM" as "SMALL" | "MEDIUM" | "LARGE" | "BULK",
    itemDescription: "",
    deliveryNotes: "",
    paymentMethod: "CASH_ON_DELIVERY" as "CASH_ON_DELIVERY" | "BANK_TRANSFER" | "PAYSTACK",
  })

  const [estimatedPrice, setEstimatedPrice] = useState(2200)
  const [isPending, startTransition] = useTransition()
  const [submittedOrder, setSubmittedOrder] = useState<{
    trackingNumber: string
    whatsAppUrl: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Recalculate price when locations or service changes
  const updatePrice = async (senderArea: string, recipientArea: string, serviceType: string, packageSize: any) => {
    const origin = DELIVERY_LOCATIONS.find(l => l.name.toLowerCase() === senderArea.toLowerCase())?.id || "mowe"
    const destination = DELIVERY_LOCATIONS.find(l => l.name.toLowerCase() === recipientArea.toLowerCase())?.id || "magboro"
    const res = await calculateDeliveryEstimate(origin, destination, serviceType, packageSize)
    setEstimatedPrice(res.rate)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updated = { ...formData, [name]: value }
    setFormData(updated)

    if (["senderArea", "recipientArea", "serviceType", "packageSize"].includes(name)) {
      updatePrice(
        name === "senderArea" ? value : formData.senderArea,
        name === "recipientArea" ? value : formData.recipientArea,
        name === "serviceType" ? value : formData.serviceType,
        name === "packageSize" ? value : formData.packageSize
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!formData.senderName || !formData.senderPhone || !formData.senderAddress) {
      setErrorMsg("Please fill in all sender / pickup contact details.")
      return
    }
    if (!formData.recipientName || !formData.recipientPhone || !formData.recipientAddress) {
      setErrorMsg("Please fill in all recipient / drop-off contact details.")
      return
    }
    if (!formData.itemDescription) {
      setErrorMsg("Please provide a brief description of the item to be delivered.")
      return
    }

    startTransition(async () => {
      try {
        const result = await createDeliveryRequest({
          ...formData,
          estimatedAmount: estimatedPrice,
        })
        if (result.success) {
          setSubmittedOrder({
            trackingNumber: result.trackingNumber,
            whatsAppUrl: result.whatsAppUrl,
          })
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to submit delivery order. Please try again.")
      }
    })
  }

  const handleDirectWhatsApp = () => {
    if (!formData.senderPhone || !formData.recipientPhone || !formData.itemDescription) {
      setErrorMsg("Please fill in sender, recipient, and item details before WhatsApp dispatch.")
      return
    }

    const hotline = "2347075733866"
    const serviceName = DELIVERY_SERVICES.find(s => s.id === formData.serviceType)?.title || formData.serviceType
    const text = `Hello Tuta Courier!%0A%0A📦 *INSTANT DELIVERY BOOKING*%0A*Service:* ${serviceName}%0A*Estimated Rate:* ₦${estimatedPrice.toLocaleString()}%0A%0A*PICKUP LOCATION:*%0A${formData.senderName} (${formData.senderPhone})%0A${formData.senderAddress}, ${formData.senderArea}%0A%0A*DROP-OFF LOCATION:*%0A${formData.recipientName} (${formData.recipientPhone})%0A${formData.recipientAddress}, ${formData.recipientArea}%0A%0A*Item:* ${formData.itemDescription}%0A*Size:* ${formData.packageSize}%0A*Notes:* ${formData.deliveryNotes || "None"}%0A%0APlease dispatch a rider for pickup! Thank you.`
    
    window.open(`https://wa.me/${hotline}?text=${text}`, "_blank")
  }

  const copyTracking = () => {
    if (submittedOrder?.trackingNumber) {
      navigator.clipboard.writeText(submittedOrder.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (submittedOrder) {
    return (
      <div className="bg-[#111113] border border-[#D4AF37]/50 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6 text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="font-heading text-3xl text-white mb-2">Delivery Request Received!</h3>
        <p className="text-white/60 text-sm max-w-md mx-auto mb-8">
          Your delivery order has been logged into the Tuta Courier dispatch queue. Our operations team is allocating a rider.
        </p>

        {/* Tracking Number Box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-center max-w-md mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-1">Your Tracking ID</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-2xl font-bold text-white tracking-wider">
              {submittedOrder.trackingNumber}
            </span>
            <button
              onClick={copyTracking}
              className="p-2 rounded-lg bg-white/10 hover:bg-[#D4AF37] hover:text-black text-white/80 transition-colors"
              title="Copy Tracking ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {copied && <p className="text-[11px] text-emerald-400 mt-1">Copied to clipboard!</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <a
            href={submittedOrder.whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/40"
          >
            <span>Notify Dispatch via WhatsApp</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => setSubmittedOrder(null)}
            className="py-4 px-6 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Book Another
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-xs text-white/50">
          Need urgent priority? Call dispatcher directly at <a href="tel:07075733866" className="text-[#D4AF37] font-semibold hover:underline">07075733866</a>.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#111113] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-2 mb-1">
            <Bike className="w-4 h-4" />
            <span>Online Booking & Dispatch</span>
          </span>
          <h3 className="text-2xl sm:text-3xl font-heading text-white">
            Schedule a Pick-Up & Delivery
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/50">Estimated Total</p>
          <p className="text-2xl font-bold text-[#D4AF37]">₦{estimatedPrice.toLocaleString()}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Step 1: Pickup Location */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs flex items-center justify-center font-bold">1</span>
            <span>Pick-Up Details (Sender)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Sender Full Name *</label>
              <input
                type="text"
                name="senderName"
                value={formData.senderName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Sender Phone Number *</label>
              <input
                type="tel"
                name="senderPhone"
                value={formData.senderPhone}
                onChange={handleChange}
                placeholder="e.g. 08012345678"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/60 mb-1.5">Pickup Street Address & Landmark *</label>
              <input
                type="text"
                name="senderAddress"
                value={formData.senderAddress}
                onChange={handleChange}
                placeholder="e.g. Suite 4, Assurance Estate, near Chrisland School"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Pickup Area / Town *</label>
              <select
                name="senderArea"
                value={formData.senderArea}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              >
                {DELIVERY_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.name} className="bg-[#18181b] text-white">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Drop-off Location */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
            <span>Delivery Details (Recipient)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Recipient Full Name *</label>
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleChange}
                placeholder="e.g. Sarah Ade"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Recipient Phone Number *</label>
              <input
                type="tel"
                name="recipientPhone"
                value={formData.recipientPhone}
                onChange={handleChange}
                placeholder="e.g. 08123456789"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/60 mb-1.5">Delivery Street Address & Landmark *</label>
              <input
                type="text"
                name="recipientAddress"
                value={formData.recipientAddress}
                onChange={handleChange}
                placeholder="e.g. House 12, Journalists Estate Road, opposite pharmacy"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Delivery Destination Town *</label>
              <select
                name="recipientArea"
                value={formData.recipientArea}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              >
                {DELIVERY_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.name} className="bg-[#18181b] text-white">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Package Details */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-white text-xs flex items-center justify-center font-bold">3</span>
            <span>Package & Service Info</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Service Category</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              >
                {DELIVERY_SERVICES.map((srv) => (
                  <option key={srv.id} value={srv.id} className="bg-[#18181b] text-white">
                    {srv.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Package Size / Weight</label>
              <select
                name="packageSize"
                value={formData.packageSize}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="SMALL" className="bg-[#18181b] text-white">Small (Letter, Small Document, Jewelry)</option>
                <option value="MEDIUM" className="bg-[#18181b] text-white">Medium (Food, Shoe box, Clothing)</option>
                <option value="LARGE" className="bg-[#18181b] text-white">Large (Electronics, Multiple packs)</option>
                <option value="BULK" className="bg-[#18181b] text-white">Bulk (Multi-item corporate delivery)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-white/60 mb-1.5">Item Description *</label>
              <input
                type="text"
                name="itemDescription"
                value={formData.itemDescription}
                onChange={handleChange}
                placeholder="e.g. Legal documents in sealed envelope, or 2 packs of fried rice and chicken"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-white/60 mb-1.5">Special Instructions / Dispatch Notes</label>
              <textarea
                name="deliveryNotes"
                value={formData.deliveryNotes}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Handle with care, fragile, call recipient 10 mins before arrival..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-xs text-white/50 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Fast, safe & tracked delivery by Tuta Courier Service</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDirectWhatsApp}
              className="px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/30"
            >
              <span>Instant WhatsApp Dispatch</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-4 rounded-xl bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50"
            >
              {isPending ? "Generating Order..." : "Submit Online Order"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
