"use client"

import { useState, useTransition } from "react"
import { PendingOrderEntry, discardStaffDraftTab, getAllPendingPOSOrders } from "@/app/actions/unified-pos-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Clock, 
  User, 
  BedDouble, 
  Utensils, 
  Wine, 
  Trash2, 
  Printer, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  AlertCircle,
  Loader2,
  DollarSign
} from "lucide-react"
import { ThermalReceiptModal, ReceiptData } from "@/components/thermal-receipt-modal"

interface AllPendingOrdersProps {
  initialPendingOrders: PendingOrderEntry[]
  onTakeOverOrder?: (order: PendingOrderEntry) => void
}

export function AllPendingOrders({ initialPendingOrders, onTakeOverOrder }: AllPendingOrdersProps) {
  const [pendingOrders, setPendingOrders] = useState<PendingOrderEntry[]>(initialPendingOrders)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "WALKIN" | "ROOM">("ALL")
  const [isRefreshing, startRefresh] = useTransition()
  const [deletingTabId, setDeletingTabId] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Refresh pending orders from server
  const handleRefresh = () => {
    startRefresh(async () => {
      const res = await getAllPendingPOSOrders()
      if (res.pendingOrders) {
        setPendingOrders(res.pendingOrders)
        setActionMessage("Pending orders refreshed successfully.")
        setTimeout(() => setActionMessage(null), 3000)
      }
    })
  }

  // Discard an active draft
  const handleDiscard = async (order: PendingOrderEntry) => {
    if (!confirm(`Are you sure you want to discard order "${order.orderName}" taken by ${order.staffName}?`)) {
      return
    }
    setDeletingTabId(order.tabId)
    try {
      const res = await discardStaffDraftTab(order.staffId, order.tabId)
      if (res.success) {
        setPendingOrders((prev) => prev.filter((o) => !(o.staffId === order.staffId && o.tabId === order.tabId)))
        setActionMessage(`Order "${order.orderName}" has been discarded.`)
        setTimeout(() => setActionMessage(null), 4000)
      } else {
        alert(res.error || "Failed to discard order.")
      }
    } catch (err: any) {
      alert(err.message || "Failed to discard order.")
    } finally {
      setDeletingTabId(null)
    }
  }

  // Print Bill Slip / Kitchen Docket
  const handlePrintSlip = (order: PendingOrderEntry) => {
    const foodItems = order.items.filter((i) => i.catalogType === "RESTAURANT")
    const drinkItems = order.items.filter((i) => i.catalogType === "BAR")

    const formattedReceipt: ReceiptData = {
      title: "PENDING ORDER BILL SLIP",
      orderNumber: `DRAFT-${order.tabId.slice(-4).toUpperCase()}`,
      date: new Date(order.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      orderType: order.orderType === "WALKIN" 
        ? `Walk-in (Held Draft)` 
        : `Room ${order.roomNumber || "Guest"} (Pending)`,
      customerName: order.customerName || (order.roomNumber ? `Room ${order.roomNumber}` : "Guest"),
      items: order.items,
      totalAmount: order.grandTotal,
      paymentStatus: "PENDING / ON-GOING",
      sections: [
        ...(foodItems.length > 0 ? [{
          title: "KITCHEN & RESTAURANT",
          items: foodItems,
          subtotal: order.foodSubtotal,
        }] : []),
        ...(drinkItems.length > 0 ? [{
          title: "MINI LOUNGE & BAR",
          items: drinkItems,
          subtotal: order.drinksSubtotal,
        }] : [])
      ]
    }
    setReceiptData(formattedReceipt)
    setIsReceiptOpen(true)
  }

  // Filtered orders
  const filteredOrders = pendingOrders.filter((order) => {
    const matchesSearch =
      order.orderName.toLowerCase().includes(search.toLowerCase()) ||
      order.staffName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (order.roomNumber && order.roomNumber.toLowerCase().includes(search.toLowerCase())) ||
      order.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()))

    const matchesType =
      filterType === "ALL" ||
      (filterType === "WALKIN" && order.orderType === "WALKIN") ||
      (filterType === "ROOM" && order.orderType === "ROOM")

    return matchesSearch && matchesType
  })

  // Aggregate stats
  const totalPendingValue = pendingOrders.reduce((sum, o) => sum + o.grandTotal, 0)
  const totalItemsPending = pendingOrders.reduce((sum, o) => sum + o.totalItemsCount, 0)
  const uniqueStaffCount = new Set(pendingOrders.map((o) => o.staffId)).size

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── 1. KPI SUMMARY STATS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{pendingOrders.length}</span>
            <span className="text-xs text-muted-foreground font-medium">active carts</span>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Value</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-primary">₦{totalPendingValue.toLocaleString()}</span>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Items</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{totalItemsPending}</span>
            <span className="text-xs text-muted-foreground font-medium">meals &amp; drinks</span>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/70 backdrop-blur-md p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Staff Taking Orders</span>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{uniqueStaffCount}</span>
            <span className="text-xs text-muted-foreground font-medium">team members</span>
          </div>
        </Card>
      </div>

      {/* ── 2. SEARCH & FILTER TOOLBAR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/70 backdrop-blur-md p-3 rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-muted/80 rounded-xl border border-border/60 text-xs font-bold">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === "ALL" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({pendingOrders.length})
            </button>
            <button
              onClick={() => setFilterType("WALKIN")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === "WALKIN" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Walk-in
            </button>
            <button
              onClick={() => setFilterType("ROOM")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === "ROOM" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Room Charge
            </button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl border-border/70 text-xs font-bold shrink-0 flex items-center gap-1.5 hover:border-primary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search table, customer, staff, or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background/80 border-border/60"
          />
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ── 3. PENDING ORDERS GRID ────────────────────────────────────────── */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isDeleting = deletingTabId === order.tabId

            return (
              <Card
                key={`${order.staffId}-${order.tabId}`}
                className="rounded-2xl border-border/70 bg-card/80 backdrop-blur-xl shadow-md overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all"
              >
                <div>
                  {/* Card Header */}
                  <CardHeader className="p-4 pb-3 border-b border-border/40 bg-muted/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-extrabold text-foreground">
                            {order.orderName}
                          </CardTitle>
                          {order.isSaved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              ● Held Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span>Staff: <strong className="text-foreground">{order.staffName}</strong></span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            order.orderType === "WALKIN"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {order.orderType === "WALKIN" ? <User className="w-2.5 h-2.5" /> : <BedDouble className="w-2.5 h-2.5" />}
                          {order.orderType === "WALKIN" ? "Walk-in" : `Room ${order.roomNumber || ""}`}
                        </span>
                        <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                          {order.savedAt || new Date(order.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Card Body: Itemized List */}
                  <CardContent className="p-4 space-y-3 text-xs">
                    {order.customerName && (
                      <div className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-xl border border-border/40">
                        Guest: <strong className="text-foreground">{order.customerName}</strong>
                      </div>
                    )}

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {order.items.map((item, idx) => {
                        const isFood = item.catalogType === "RESTAURANT"
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                                  isFood
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                }`}
                              >
                                {isFood ? "Food" : "Drink"}
                              </span>
                              <span className="font-medium text-foreground truncate">
                                {item.name}
                              </span>
                              <span className="text-muted-foreground text-[10px] shrink-0">
                                ×{item.quantity}
                              </span>
                            </div>
                            <span className="font-bold text-foreground shrink-0 font-mono">
                              ₦{item.totalPrice.toLocaleString()}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Breakdown totals */}
                    <div className="pt-2 border-t border-border/40 space-y-1 text-[11px] text-muted-foreground">
                      {order.foodSubtotal > 0 && (
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            <Utensils className="w-3 h-3 text-amber-500" /> Kitchen Subtotal:
                          </span>
                          <span className="font-bold text-foreground">₦{order.foodSubtotal.toLocaleString()}</span>
                        </div>
                      )}
                      {order.drinksSubtotal > 0 && (
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            <Wine className="w-3 h-3 text-purple-500" /> Bar Subtotal:
                          </span>
                          <span className="font-bold text-foreground">₦{order.drinksSubtotal.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-border/40 text-sm font-black text-foreground">
                        <span>Total Pending:</span>
                        <span className="text-primary font-mono text-base">₦{order.grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 pt-0 border-t border-border/40 bg-muted/10 grid grid-cols-3 gap-2">
                  {/* Take Over in POS */}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => onTakeOverOrder && onTakeOverOrder(order)}
                    className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1 col-span-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Take Over</span>
                  </Button>

                  {/* Print Bill Slip */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintSlip(order)}
                    className="h-9 rounded-xl border-border/70 text-xs font-bold flex items-center justify-center gap-1 hover:border-primary col-span-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Bill Slip</span>
                  </Button>

                  {/* Discard Draft */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDiscard(order)}
                    disabled={isDeleting}
                    className="h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1 col-span-1"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Discard</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center bg-card/50 backdrop-blur-md rounded-3xl border border-dashed border-border/70 p-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Pending Orders</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            All customer meal and drink orders have been finalized. When staff members hold orders in progress across the property, they will appear here live.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-xl text-xs font-bold border-border/60 hover:border-primary mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Check Again
          </Button>
        </div>
      )}

      {/* ── 4. THERMAL RECEIPT MODAL FOR PREVIEW / BILL PRINT ─────────────── */}
      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        data={receiptData}
      />
    </div>
  )
}
