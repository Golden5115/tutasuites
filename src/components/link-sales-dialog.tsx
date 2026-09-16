"use client"

import { useState, useEffect, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Link2, 
  Utensils, 
  Wine, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Search, 
  ArrowRight,
  Receipt,
  BedDouble,
  User,
  Plus
} from "lucide-react"
import { getPotentialLinks, linkOrders, getCombinedReceiptData } from "@/app/actions/combined-order-actions"
import { ThermalReceiptModal, ReceiptData } from "@/components/thermal-receipt-modal"

interface LinkSalesDialogProps {
  isOpen: boolean
  onClose: () => void
  initialRestaurantOrderId?: string
  initialBarOrderId?: string
  onLinkSuccess?: () => void
}

export function LinkSalesDialog({
  isOpen,
  onClose,
  initialRestaurantOrderId,
  initialBarOrderId,
  onLinkSuccess
}: LinkSalesDialogProps) {
  const [loading, setLoading] = useState(true)
  const [smartMatches, setSmartMatches] = useState<any[]>([])
  const [restaurantOrders, setRestaurantOrders] = useState<any[]>([])
  const [barOrders, setBarOrders] = useState<any[]>([])
  
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(initialRestaurantOrderId || "")
  const [selectedBarId, setSelectedBarId] = useState<string>(initialBarOrderId || "")
  
  const [searchRest, setSearchRest] = useState("")
  const [searchBar, setSearchBar] = useState("")
  
  const [isLinking, startLinking] = useTransition()
  const [errorMessage, setErrorMessage] = useState("")
  const [generatedReceipt, setGeneratedReceipt] = useState<ReceiptData | null>(null)

  // Fetch candidate orders whenever dialog opens
  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setErrorMessage("")
    if (initialRestaurantOrderId) setSelectedRestaurantId(initialRestaurantOrderId)
    if (initialBarOrderId) setSelectedBarId(initialBarOrderId)

    getPotentialLinks("today").then((res) => {
      setSmartMatches(res.smartMatches || [])
      setRestaurantOrders(res.unlinkedRestaurantOrders || [])
      setBarOrders(res.unlinkedBarOrders || [])
      setLoading(false)
    })
  }, [isOpen, initialRestaurantOrderId, initialBarOrderId])

  const selectedRestOrder = restaurantOrders.find((r) => r.id === selectedRestaurantId)
  const selectedBarOrder = barOrders.find((b) => b.id === selectedBarId)

  const combinedTotal = (selectedRestOrder?.totalAmount || 0) + (selectedBarOrder?.totalAmount || 0)

  const handleApplySmartMatch = (match: any) => {
    setSelectedRestaurantId(match.restaurantOrder.id)
    setSelectedBarId(match.barOrder.id)
  }

  const handleLinkAndGenerate = () => {
    if (!selectedRestaurantId || !selectedBarId) {
      setErrorMessage("Please select both a Restaurant order and a Bar order to link.")
      return
    }

    setErrorMessage("")
    startLinking(async () => {
      const res = await linkOrders({
        restaurantOrderId: selectedRestaurantId,
        barOrderId: selectedBarId
      })

      if (res.error) {
        setErrorMessage(res.error)
        return
      }

      // Fetch combined receipt data for immediate thermal modal preview
      const receiptRes = await getCombinedReceiptData({
        restaurantOrderId: selectedRestaurantId,
        barOrderId: selectedBarId
      })

      if (receiptRes.success && receiptRes.receiptData) {
        setGeneratedReceipt(receiptRes.receiptData)
      }

      if (onLinkSuccess) {
        onLinkSuccess()
      }
    })
  }

  const filteredRest = restaurantOrders.filter((o) => {
    const term = searchRest.toLowerCase()
    const idMatch = o.id.toLowerCase().includes(term)
    const custMatch = (o.customerName || "").toLowerCase().includes(term)
    const roomMatch = (o.reservation?.room?.number || "").toLowerCase().includes(term)
    const itemMatch = o.items.some((i: any) => (i.item?.name || "").toLowerCase().includes(term))
    return idMatch || custMatch || roomMatch || itemMatch
  })

  const filteredBar = barOrders.filter((o) => {
    const term = searchBar.toLowerCase()
    const idMatch = o.id.toLowerCase().includes(term)
    const custMatch = (o.customerName || "").toLowerCase().includes(term)
    const roomMatch = (o.reservation?.room?.number || "").toLowerCase().includes(term)
    const itemMatch = o.items.some((i: any) => (i.item?.name || "").toLowerCase().includes(term))
    return idMatch || custMatch || roomMatch || itemMatch
  })

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden bg-background border-primary/20">
          <DialogHeader className="pb-3 border-b shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Link Food & Bar Sales
                  <span className="text-[11px] font-semibold bg-primary/15 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    One Receipt
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Combine separate restaurant kitchen orders and bar drinks into a single linked receipt for the guest.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-3 custom-scrollbar pr-1">
            {loading ? (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-semibold">Scanning today's sales records...</p>
              </div>
            ) : (
              <>
                {/* SMART MATCHES (Detected Automatically) */}
                {smartMatches.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/5 border border-primary/30">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Auto-Detected Matches ({smartMatches.length})
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Orders sharing same guest or room</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {smartMatches.map((m, idx) => {
                        const isChosen =
                          selectedRestaurantId === m.restaurantOrder.id &&
                          selectedBarId === m.barOrder.id
                        const total = m.restaurantOrder.totalAmount + m.barOrder.totalAmount

                        return (
                          <div
                            key={idx}
                            onClick={() => handleApplySmartMatch(m)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                              isChosen
                                ? "bg-primary/20 border-primary shadow-md shadow-primary/10"
                                : "bg-card/70 hover:bg-muted/60 border-border/80"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary text-black">
                                {m.reason}
                              </span>
                              <span className="text-xs font-bold text-primary">
                                ₦{total.toLocaleString()}
                              </span>
                            </div>

                            <div className="text-xs space-y-1 text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Utensils className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="font-semibold text-foreground truncate">
                                  #{m.restaurantOrder.id.slice(-4).toUpperCase()}
                                </span>
                                <span className="truncate">
                                  ({m.restaurantOrder.items.length} dishes, ₦{m.restaurantOrder.totalAmount.toLocaleString()})
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Wine className="w-3 h-3 text-purple-500 shrink-0" />
                                <span className="font-semibold text-foreground truncate">
                                  #{m.barOrder.id.slice(-4).toUpperCase()}
                                </span>
                                <span className="truncate">
                                  ({m.barOrder.items.length} drinks, ₦{m.barOrder.totalAmount.toLocaleString()})
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* MANUAL SELECTION (Two Columns) */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* LEFT: RESTAURANT (FOOD) */}
                  <div className="flex flex-col border rounded-2xl p-4 bg-card/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          1. Select Food Sale
                        </h4>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {restaurantOrders.length} unlinked
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search food order or customer..."
                        value={searchRest}
                        onChange={(e) => setSearchRest(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                      {filteredRest.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6 italic">
                          No unlinked food orders found.
                        </p>
                      ) : (
                        filteredRest.map((order) => {
                          const isSelected = selectedRestaurantId === order.id
                          const custName =
                            order.customerName ||
                            (order.reservation?.guest
                              ? `${order.reservation.guest.firstName} ${order.reservation.guest.lastName}`
                              : "Walk-in Guest")
                          const roomNum = order.reservation?.room?.number

                          return (
                            <div
                              key={order.id}
                              onClick={() => setSelectedRestaurantId(order.id)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-amber-500/15 border-amber-500/60 shadow-sm"
                                  : "hover:bg-muted/40 border-border/60"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-foreground">
                                    #{order.id.slice(-6).toUpperCase()}
                                  </span>
                                  <span className="text-muted-foreground ml-1.5 font-medium">
                                    • {custName}
                                  </span>
                                </div>
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  ₦{order.totalAmount.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                                <span className="truncate max-w-[180px]">
                                  {order.items.map((i: any) => `${i.quantity}x ${i.item?.name}`).join(", ")}
                                </span>
                                {roomNum && (
                                  <span className="text-purple-600 font-semibold shrink-0">
                                    Room {roomNum}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* RIGHT: BAR (DRINKS) */}
                  <div className="flex flex-col border rounded-2xl p-4 bg-card/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wine className="w-4 h-4 text-purple-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          2. Select Bar Drinks Sale
                        </h4>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {barOrders.length} unlinked
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search bar order or customer..."
                        value={searchBar}
                        onChange={(e) => setSearchBar(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                      {filteredBar.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6 italic">
                          No unlinked bar orders found.
                        </p>
                      ) : (
                        filteredBar.map((order) => {
                          const isSelected = selectedBarId === order.id
                          const custName =
                            order.customerName ||
                            (order.reservation?.guest
                              ? `${order.reservation.guest.firstName} ${order.reservation.guest.lastName}`
                              : "Walk-in Guest")
                          const roomNum = order.reservation?.room?.number

                          return (
                            <div
                              key={order.id}
                              onClick={() => setSelectedBarId(order.id)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-purple-500/15 border-purple-500/60 shadow-sm"
                                  : "hover:bg-muted/40 border-border/60"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-foreground">
                                    #{order.id.slice(-6).toUpperCase()}
                                  </span>
                                  <span className="text-muted-foreground ml-1.5 font-medium">
                                    • {custName}
                                  </span>
                                </div>
                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                  ₦{order.totalAmount.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                                <span className="truncate max-w-[180px]">
                                  {order.items.map((i: any) => `${i.quantity}x ${i.item?.name}`).join(", ")}
                                </span>
                                {roomNum && (
                                  <span className="text-purple-600 font-semibold shrink-0">
                                    Room {roomNum}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* SUMMARY SELECTION BAR */}
                {selectedRestOrder && selectedBarOrder && (
                  <div className="p-4 rounded-2xl border border-primary/40 bg-card flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Ready to Combine: Kitchen (#{selectedRestOrder.id.slice(-4).toUpperCase()}) + Bar (#{selectedBarOrder.id.slice(-4).toUpperCase()})
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Kitchen ₦{selectedRestOrder.totalAmount.toLocaleString()} + Bar ₦{selectedBarOrder.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground block">Combined Total</span>
                        <span className="text-xl font-black text-primary">₦{combinedTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <p className="text-red-500 text-xs font-semibold text-center bg-red-500/10 py-2 rounded-xl border border-red-500/20">
                    {errorMessage}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="pt-3 border-t flex items-center justify-between gap-3 shrink-0">
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>

            <Button
              onClick={handleLinkAndGenerate}
              disabled={!selectedRestaurantId || !selectedBarId || isLinking}
              className="gap-2 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-md hover:opacity-90 transition-all px-6 py-5"
            >
              {isLinking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Linking Sales...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" /> Link Sales & Generate Receipt
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instant Thermal Receipt Modal upon success */}
      <ThermalReceiptModal
        isOpen={!!generatedReceipt}
        onClose={() => {
          setGeneratedReceipt(null)
          onClose()
        }}
        data={generatedReceipt}
      />
    </>
  )
}
