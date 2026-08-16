"use client"

import { useState, useTransition } from "react"
import { getRestaurantOrders, getRestaurantAnalytics } from "@/app/actions/restaurant-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Printer, 
  Search, 
  FileText, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Utensils, 
  BedDouble, 
  User, 
  Sparkles,
  Loader2,
  Receipt,
  Flame,
  Layers
} from "lucide-react"
import Link from "next/link"
import { printDailySummary } from "@/lib/daily-summary-print"
import { ThermalReceiptModal, ReceiptData } from "@/components/thermal-receipt-modal"

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
  }
}

export function RestaurantSalesHistory({ initialOrders, initialAnalytics }: RestaurantSalesHistoryProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [analytics, setAnalytics] = useState(initialAnalytics)
  const [dateFilter, setDateFilter] = useState<string>("today")
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isPrintingSummary, setIsPrintingSummary] = useState(false)

  const handleFilterChange = (filter: string) => {
    setDateFilter(filter)
    startTransition(async () => {
      const [newOrders, newAnalytics] = await Promise.all([
        getRestaurantOrders({ dateFilter: filter }),
        getRestaurantAnalytics(filter)
      ])
      setOrders(newOrders)
      setAnalytics(newAnalytics)
    })
  }

  const filteredOrders = orders.filter(order => {
    const term = search.toLowerCase()
    const idMatch = order.id.toLowerCase().includes(term)
    const customerMatch = (order.customerName || "").toLowerCase().includes(term)
    const roomMatch = (order.reservation?.room?.number || "").toLowerCase().includes(term)
    const guestMatch = order.reservation?.guest 
      ? `${order.reservation.guest.firstName} ${order.reservation.guest.lastName}`.toLowerCase().includes(term) 
      : false
    const itemMatch = order.items.some((i: any) => (i.item?.name || "").toLowerCase().includes(term))
    return idMatch || customerMatch || roomMatch || guestMatch || itemMatch
  })

  const handleReprint = (order: any) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const receipt: ReceiptData = {
      title: "RESTAURANT RECEIPT",
      orderNumber: order.id.slice(-6).toUpperCase(),
      date: orderDate,
      customerName: order.customerName || (order.isWalkIn ? "Walk-in Guest" : order.reservation?.guest ? `${order.reservation.guest.firstName} ${order.reservation.guest.lastName}` : "Room Guest"),
      roomNumber: order.reservation?.room?.number,
      orderType: order.isWalkIn ? "Walk-in" : "Room Charge",
      items: order.items.map((i: any) => ({
        name: i.item?.name || "Food Item",
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
        department: "KITCHEN & RESTAURANT",
        dateLabel: dateLabels[dateFilter] || dateFilter,
        totalRevenue: analytics.totalRevenue,
        totalOrders: analytics.totalOrders,
        walkInRevenue: analytics.walkInRevenue,
        walkInOrdersCount: analytics.walkInCount,
        roomChargeRevenue: analytics.roomChargeRevenue,
        roomChargeOrdersCount: analytics.roomChargeCount,
        itemsSold: analytics.itemsSold.map(i => ({
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

        <Button
          onClick={handlePrintDailySummary}
          disabled={isPrintingSummary || analytics.totalOrders === 0}
          className="gap-2 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-md hover:opacity-90 transition-all"
        >
          {isPrintingSummary ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Printer className="w-4 h-4" />
          )}
          Print Kitchen Shift Report (80mm)
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kitchen Revenue</p>
          </div>
          <p className="text-2xl font-bold text-foreground">₦{analytics.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{analytics.totalOrders} total food orders</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Walk-in Dining</p>
          </div>
          <p className="text-2xl font-bold text-foreground">₦{analytics.walkInRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{analytics.walkInCount} walk-in orders</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <BedDouble className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Room Service</p>
          </div>
          <p className="text-2xl font-bold text-foreground">₦{analytics.roomChargeRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{analytics.roomChargeCount} billed to guest rooms</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Food Dish</p>
          </div>
          <p className="text-lg font-bold text-foreground truncate">
            {analytics.topItems[0]?.name || "None yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.topItems[0] ? `${analytics.topItems[0].quantity} portions sold (₦${analytics.topItems[0].revenue.toLocaleString()})` : "No food sales in period"}
          </p>
        </div>
      </div>

      {/* Best Seller Food Combos & Top Dishes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Seller Dishes */}
        <Card className="shadow-sm border-border/80 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base">Top Selling Dishes</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Most ordered kitchen menu items ranked by portions sold.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {analytics.topItems.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">No food sales recorded in this period.</p>
            ) : (
              <div className="space-y-2.5">
                {analytics.topItems.slice(0, 5).map((item, idx) => (
                  <div key={item.name} className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate text-foreground">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.quantity} portions</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      ₦{item.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Seller Food Combos */}
        <Card className="shadow-sm border-border/80 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Best Seller Food Combos</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Items most frequently ordered together by guests and diners.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {analytics.topCombos.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                Not enough multi-item orders yet to calculate combos for this period.
              </p>
            ) : (
              <div className="space-y-2.5">
                {analytics.topCombos.map((combo, idx) => (
                  <div key={combo.combo} className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <p className="text-xs font-bold truncate text-foreground">{combo.combo}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0 ml-2">
                      {combo.count}x ordered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="shadow-sm border-border/80">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Kitchen Sales History & Receipts
              </CardTitle>
              <CardDescription className="text-xs">
                Review all past kitchen orders, room room service bills, and re-print receipts.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search order #, customer, room, dish..."
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
              <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm">No kitchen sales records found</p>
              <p className="text-xs">Try selecting a different date range or search query.</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/40 uppercase tracking-wider text-[11px] text-muted-foreground font-semibold">
                  <tr className="text-left">
                    <th className="p-3.5">Order Info</th>
                    <th className="p-3.5">Customer / Room</th>
                    <th className="p-3.5">Dishes & Portions</th>
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

                    return (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-foreground">#{order.id.slice(-6).toUpperCase()}</div>
                          <div className="text-[10px] text-muted-foreground">{orderDate}</div>
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
                            {order.items.map((i: any) => (
                              <div key={i.id} className="truncate text-muted-foreground">
                                <span className="font-semibold text-foreground">{i.quantity}x</span> {i.item?.name || "Food Item"}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-foreground">₦{order.totalAmount.toLocaleString()}</span>
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
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReprint(order)}
                              className="h-7 px-2 text-[11px] gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Printer className="w-3 h-3" />
                              Reprint
                            </Button>
                            <Link href={`/dashboard/restaurant/${order.id}/invoice`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] gap-1 rounded-lg text-muted-foreground hover:text-foreground"
                              >
                                <FileText className="w-3 h-3" />
                                Invoice
                              </Button>
                            </Link>
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
    </div>
  )
}
