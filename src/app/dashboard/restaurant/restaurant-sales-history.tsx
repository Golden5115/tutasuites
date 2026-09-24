"use client"

import { useState, useTransition } from "react"
import { getUnifiedPOSSalesHistory, getUnifiedPOSAnalytics } from "@/app/actions/unified-pos-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Printer, 
  Search, 
  FileText, 
  DollarSign, 
  Utensils, 
  BedDouble, 
  User, 
  Loader2, 
  Receipt, 
  Flame, 
  Layers,
  Link2,
  Wine
} from "lucide-react"
import Link from "next/link"
import { printDailySummary } from "@/lib/daily-summary-print"
import { ThermalReceiptModal, ReceiptData } from "@/components/thermal-receipt-modal"
import { LinkSalesDialog } from "@/components/link-sales-dialog"
import { getCombinedReceiptData } from "@/app/actions/combined-order-actions"

interface RestaurantSalesHistoryProps {
  initialOrders: any[]
  initialAnalytics: {
    totalRevenue: number
    totalOrders: number
    walkInRevenue: number
    walkInCount: number
    roomChargeRevenue: number
    roomChargeCount: number
    itemsSold: any[]
    topItems: any[]
    topCombos: { combo: string; count: number }[]
    foodRevenue?: number
    drinksRevenue?: number
  }
}

export function RestaurantSalesHistory({ initialOrders, initialAnalytics }: RestaurantSalesHistoryProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [analytics, setAnalytics] = useState(initialAnalytics)
  const [dateFilter, setDateFilter] = useState<string>("today")
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "RESTAURANT" | "BAR" | "COMBINED">("ALL")
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isPrintingSummary, setIsPrintingSummary] = useState(false)
  const [linkingRestOrderId, setLinkingRestOrderId] = useState<string | null>(null)
  const [linkingBarOrderId, setLinkingBarOrderId] = useState<string | null>(null)
  const [isGeneralLinkOpen, setIsGeneralLinkOpen] = useState(false)
  const [isGeneratingCombined, setIsGeneratingCombined] = useState<string | null>(null)

  const handleFilterChange = (filter: string) => {
    setDateFilter(filter)
    startTransition(async () => {
      const [newOrders, newAnalytics] = await Promise.all([
        getUnifiedPOSSalesHistory({ dateFilter: filter }),
        getUnifiedPOSAnalytics(filter)
      ])
      setOrders(newOrders)
      setAnalytics(newAnalytics)
    })
  }

  const countAll = orders.length
  const countKitchen = orders.filter(o => o.orderCategory === "RESTAURANT").length
  const countBar = orders.filter(o => o.orderCategory === "BAR").length
  const countCombined = orders.filter(o => o.orderCategory === "COMBINED").length

  const filteredOrders = orders.filter(order => {
    // Filter by order category
    if (categoryFilter === "RESTAURANT" && order.orderCategory !== "RESTAURANT") return false
    if (categoryFilter === "BAR" && order.orderCategory !== "BAR") return false
    if (categoryFilter === "COMBINED" && order.orderCategory !== "COMBINED") return false

    const term = search.toLowerCase()
    const idMatch = order.id.toLowerCase().includes(term)
    const customerMatch = (order.customerName || "").toLowerCase().includes(term)
    const roomMatch = (order.reservation?.room?.number || "").toLowerCase().includes(term)
    const guestMatch = order.reservation?.guest 
      ? `${order.reservation.guest.firstName} ${order.reservation.guest.lastName}`.toLowerCase().includes(term) 
      : false
    const itemMatch = (order.items || []).some((i: any) => (i.item?.name || "").toLowerCase().includes(term))
    const barItemMatch = (order.linkedBarOrder?.items || []).some((i: any) => (i.item?.name || "").toLowerCase().includes(term))
    return idMatch || customerMatch || roomMatch || guestMatch || itemMatch || barItemMatch
  })

  const handleReprint = (order: any) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const isBar = order.orderCategory === "BAR"
    const receipt: ReceiptData = {
      title: isBar ? "MINI LOUNGE RECEIPT" : "RESTAURANT RECEIPT",
      orderNumber: order.id.slice(-6).toUpperCase(),
      date: orderDate,
      customerName: order.customerName || (order.isWalkIn ? "Walk-in Guest" : order.reservation?.guest ? `${order.reservation.guest.firstName} ${order.reservation.guest.lastName}` : "Room Guest"),
      roomNumber: order.reservation?.room?.number,
      orderType: order.isWalkIn ? "Walk-in" : "Room Charge",
      items: (order.items || []).map((i: any) => ({
        name: i.item?.name || (isBar ? "Drink Item" : "Food Item"),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice
      })),
      totalAmount: order.totalAmount,
      paymentStatus: order.isWalkIn ? "COMPLETED" : "CHARGED TO ROOM"
    }

    setSelectedReceipt(receipt)
  }

  const handlePrintDailySummary = async () => {
    setIsPrintingSummary(true)
    try {
      const dateLabels: Record<string, string> = {
        today: "Today (" + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ")",
        yesterday: "Yesterday",
        week: "Last 7 Days",
        month: "This Month",
        all: "All Time Record"
      }

      await printDailySummary({
        department: "RESTAURANT & BAR",
        dateLabel: dateLabels[dateFilter] || dateFilter,
        totalRevenue: analytics.totalRevenue,
        totalOrders: analytics.totalOrders,
        walkInRevenue: analytics.walkInRevenue,
        walkInOrdersCount: analytics.walkInCount,
        roomChargeRevenue: analytics.roomChargeRevenue,
        roomChargeOrdersCount: analytics.roomChargeCount,
        itemsSold: (analytics.itemsSold || []).map(i => ({
          name: i.name,
          quantity: i.quantity,
          revenue: i.revenue
        })),
        topCombos: analytics.topCombos
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsPrintingSummary(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar & Summary Print Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/80 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "week", label: "Last 7 Days" },
            { key: "month", label: "This Month" },
            { key: "all", label: "All Time" }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                dateFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
          {isPending && <Loader2 className="w-4 h-4 animate-spin text-primary ml-2" />}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            onClick={() => setIsGeneralLinkOpen(true)}
            variant="outline"
            className="gap-1.5 border-primary/40 text-foreground hover:bg-primary/10 text-xs rounded-xl font-bold h-9"
          >
            <Link2 className="w-4 h-4 text-primary" />
            Link Food & Bar Sales
          </Button>

          <Button
            onClick={handlePrintDailySummary}
            disabled={isPrintingSummary || analytics.totalOrders === 0}
            className="gap-2 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-md hover:opacity-90 transition-all h-9"
          >
            {isPrintingSummary ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            Print Shift Report (80mm)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total POS Revenue</p>
          </div>
          <p className="text-2xl font-bold text-foreground">₦{analytics.totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
            <span>Food: <strong className="text-foreground">₦{(analytics.foodRevenue ?? 0).toLocaleString()}</strong></span>
            <span>•</span>
            <span>Drinks: <strong className="text-foreground">₦{(analytics.drinksRevenue ?? 0).toLocaleString()}</strong></span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Walk-in Sales</p>
          </div>
          <p className="text-2xl font-bold text-foreground">₦{analytics.walkInRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{analytics.walkInCount} walk-in orders paid</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <BedDouble className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Room Charges</p>
          </div>
          <p className="text-2xl font-bold text-foreground">₦{analytics.roomChargeRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{analytics.roomChargeCount} billed to guest rooms</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Item</p>
          </div>
          <p className="text-lg font-bold text-foreground truncate">
            {analytics.topItems?.[0]?.name || "None yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.topItems?.[0] ? `${analytics.topItems[0].quantity} sold (₦${analytics.topItems[0].revenue.toLocaleString()})` : "No sales in period"}
          </p>
        </div>
      </div>

      {/* Best Seller Combos & Top Items Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Seller Items */}
        <Card className="shadow-sm border-border/80 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base">Top Selling Items (Kitchen & Bar)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Most ordered food dishes and bar drinks ranked by volume.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {(!analytics.topItems || analytics.topItems.length === 0) ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No items sold in selected timeframe.
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-foreground truncate">{item.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                        item.type === "DRINK" 
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }`}>
                        {item.category || (item.type === "DRINK" ? "Bar" : "Food")}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-foreground">{item.quantity} sold</span>
                      <span className="text-[10px] text-muted-foreground block">₦{item.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Combos */}
        <Card className="shadow-sm border-border/80 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Popular Order Combos</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Frequent food & drink pairings ordered together.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {(!analytics.topCombos || analytics.topCombos.length === 0) ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No paired combo patterns detected yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {analytics.topCombos.map((c) => (
                  <div key={c.combo} className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate max-w-[80%]">{c.combo}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                      {c.count}x ordered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Order History Table */}
      <Card className="shadow-sm border-border/80 overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Restaurant & Bar Sales History
              </CardTitle>
              <CardDescription className="text-xs">
                Review all past food, bar, and combined orders, inspect invoices, and re-print receipts.
              </CardDescription>
            </div>

            {/* Category Filter Tabs */}
            <div className="inline-flex p-1 bg-muted/80 backdrop-blur-md rounded-xl border border-border/80 shadow-sm self-start sm:self-auto flex-wrap">
              <button
                onClick={() => setCategoryFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === "ALL"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Sales ({countAll})
              </button>
              <button
                onClick={() => setCategoryFilter("RESTAURANT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  categoryFilter === "RESTAURANT"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                Kitchen ({countKitchen})
              </button>
              <button
                onClick={() => setCategoryFilter("BAR")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  categoryFilter === "BAR"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wine className="w-3.5 h-3.5" />
                Bar Only ({countBar})
              </button>
              <button
                onClick={() => setCategoryFilter("COMBINED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  categoryFilter === "COMBINED"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Combined ({countCombined})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search order #, customer, room, item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-background"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm">No sales records found</p>
              <p className="text-xs">Try selecting a different date range, category filter, or search query.</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/40 uppercase tracking-wider text-[11px] text-muted-foreground font-semibold">
                  <tr className="text-left">
                    <th className="p-3.5">Order Info</th>
                    <th className="p-3.5">Customer / Room</th>
                    <th className="p-3.5">Ordered Items</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Billing Type</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredOrders.map(order => {
                    const orderDate = new Date(order.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric'
                    })
                    const customerName = order.customerName || (order.isWalkIn ? "Walk-in Guest" : order.reservation?.guest ? `${order.reservation.guest.firstName} ${order.reservation.guest.lastName}` : "Room Guest")
                    const isBarOnly = order.orderCategory === "BAR"
                    const isCombined = order.orderCategory === "COMBINED"

                    return (
                      <tr key={`${order.orderCategory}-${order.id}`} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-foreground">#{order.id.slice(-6).toUpperCase()}</div>
                          <div className="text-[10px] text-muted-foreground">{orderDate}</div>
                          
                          {/* Category Badge */}
                          {isBarOnly && (
                            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                              <Wine className="w-2.5 h-2.5" />
                              Bar Order
                            </div>
                          )}
                          {isCombined && order.linkedBarOrder && (
                            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20">
                              <Layers className="w-2.5 h-2.5" />
                              Food + Bar #{order.linkedBarOrder.id.slice(-4).toUpperCase()}
                            </div>
                          )}
                          {!isBarOnly && !isCombined && (
                            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                              <Utensils className="w-2.5 h-2.5" />
                              Kitchen Order
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-foreground">{customerName}</div>
                          {order.reservation?.room && (
                            <div className="text-[10px] text-purple-600 font-semibold">
                              Room {order.reservation.room.number}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="space-y-0.5">
                            {(order.items || []).map((i: any) => (
                              <div key={i.id} className="truncate text-muted-foreground">
                                <span className="font-semibold text-foreground">{i.quantity}x</span> {i.item?.name || (isBarOnly ? "Drink Item" : "Food Item")}
                              </div>
                            ))}
                            {isCombined && order.linkedBarOrder?.items && (
                              <div className="pt-1 mt-1 border-t border-border/40 text-[10px]">
                                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <Wine className="w-2.5 h-2.5" /> Bar Items:
                                </span>
                                {order.linkedBarOrder.items.map((bi: any) => (
                                  <div key={bi.id} className="truncate text-muted-foreground pl-3">
                                    <span className="font-semibold text-foreground">{bi.quantity}x</span> {bi.item?.name || "Drink Item"}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {isCombined && order.linkedBarOrder ? (
                            <div>
                              <span className="font-bold text-primary text-sm">
                                ₦{(order.totalAmount + order.linkedBarOrder.totalAmount).toLocaleString()}
                              </span>
                              <div className="text-[10px] text-muted-foreground">
                                Food: ₦{order.totalAmount.toLocaleString()} • Bar: ₦{order.linkedBarOrder.totalAmount.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="font-bold text-foreground text-sm">
                              ₦{order.totalAmount.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {order.isWalkIn ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Walk-in (Paid)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                              Room Charge
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Combined Receipt Button */}
                            {isCombined && order.linkedBarOrder && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  setIsGeneratingCombined(order.id)
                                  const res = await getCombinedReceiptData({
                                    restaurantOrderId: order.id,
                                    barOrderId: order.linkedBarOrder.id
                                  })
                                  if (res.success && res.receiptData) {
                                    setSelectedReceipt(res.receiptData)
                                  }
                                  setIsGeneratingCombined(null)
                                }}
                                disabled={isGeneratingCombined === order.id}
                                className="h-7 px-2 text-[11px] gap-1 rounded-lg bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 font-bold"
                              >
                                {isGeneratingCombined === order.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Receipt className="w-3 h-3" />
                                )}
                                Combined Receipt
                              </Button>
                            )}

                            {/* Link Button if unlinked */}
                            {isBarOnly ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLinkingBarOrderId(order.id)}
                                className="h-7 px-2 text-[11px] gap-1 rounded-lg border-dashed border-amber-500/50 text-foreground hover:bg-amber-500/10"
                              >
                                <Link2 className="w-3 h-3 text-amber-500" />
                                Link to Food
                              </Button>
                            ) : !isCombined ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLinkingRestOrderId(order.id)}
                                className="h-7 px-2 text-[11px] gap-1 rounded-lg border-dashed border-primary/50 text-foreground hover:bg-primary/10"
                              >
                                <Link2 className="w-3 h-3 text-primary" />
                                Link to Bar
                              </Button>
                            ) : null}

                            {/* Reprint Receipt Button */}
                            {isBarOnly ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReprint(order)}
                                className="h-7 px-2 text-[11px] gap-1 rounded-lg border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
                              >
                                <Printer className="w-3 h-3" />
                                Bar Receipt
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReprint(order)}
                                className="h-7 px-2 text-[11px] gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10 font-medium"
                              >
                                <Printer className="w-3 h-3" />
                                Kitchen
                              </Button>
                            )}

                            {/* Invoice Link */}
                            {isCombined && order.linkedBarOrder ? (
                              <Link href={`/dashboard/combined-invoice?restaurantId=${order.id}&barId=${order.linkedBarOrder.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] gap-1 rounded-lg text-muted-foreground hover:text-foreground font-semibold"
                                >
                                  <FileText className="w-3 h-3 text-purple-500" />
                                  Invoice
                                </Button>
                              </Link>
                            ) : isBarOnly ? (
                              <Link href={`/dashboard/bar/${order.id}/invoice`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] gap-1 rounded-lg text-muted-foreground hover:text-foreground font-semibold"
                                >
                                  <FileText className="w-3 h-3 text-amber-500" />
                                  Invoice
                                </Button>
                              </Link>
                            ) : (
                              <Link href={`/dashboard/restaurant/${order.id}/invoice`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] gap-1 rounded-lg text-muted-foreground hover:text-foreground font-semibold"
                                >
                                  <FileText className="w-3 h-3 text-emerald-500" />
                                  Invoice
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Thermal Receipt Modal for Instant Reprint */}
      <ThermalReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        data={selectedReceipt}
      />

      {/* Link Sales Dialog */}
      <LinkSalesDialog
        isOpen={isGeneralLinkOpen || !!linkingRestOrderId || !!linkingBarOrderId}
        initialRestaurantOrderId={linkingRestOrderId || undefined}
        initialBarOrderId={linkingBarOrderId || undefined}
        onClose={() => {
          setIsGeneralLinkOpen(false)
          setLinkingRestOrderId(null)
          setLinkingBarOrderId(null)
        }}
        onLinkSuccess={() => {
          setIsGeneralLinkOpen(false)
          setLinkingRestOrderId(null)
          setLinkingBarOrderId(null)
          startTransition(async () => {
            const [newOrders, newAnalytics] = await Promise.all([
              getUnifiedPOSSalesHistory({ dateFilter }),
              getUnifiedPOSAnalytics(dateFilter)
            ])
            setOrders(newOrders)
            setAnalytics(newAnalytics)
          })
        }}
      />
    </div>
  )
}
