"use client"

import { useState, useTransition, useEffect } from "react"
import {
  GrabAndGoMenuItem,
  createGrabAndGoOrder,
  getGrabAndGoOrders,
  getGrabAndGoAnalytics,
} from "@/app/actions/grab-and-go-actions"

const GRAB_AND_GO_CATEGORIES = [
  "Rice",
  "Swallow",
  "Soups",
  "Protein",
  "Sides",
  "Extras",
  "Drinks",
] as const
import { ThermalReceiptModal, ReceiptData } from "@/components/thermal-receipt-modal"
import { printDailySummary } from "@/lib/daily-summary-print"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ShoppingBag,
  UtensilsCrossed,
  Flame,
  Soup,
  Drumstick,
  Salad,
  PackagePlus,
  CupSoda,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Search,
  History,
  Settings2,
  Zap,
  Banknote,
  CreditCard,
  Smartphone,
  Loader2,
  RotateCcw,
  Sparkles,
  Receipt,
  Edit3,
  X,
  User,
} from "lucide-react"

interface PackCartItem {
  item: GrabAndGoMenuItem
  quantity: number
}

interface CustomerPackTab {
  id: string
  label: string
  customerName: string
  orderType: "TAKEAWAY" | "EAT_IN"
  paymentMethod: "CASH" | "POS" | "TRANSFER"
  notes: string
  cart: PackCartItem[]
}

interface GrabAndGoClientProps {
  initialCatalog: GrabAndGoMenuItem[]
  initialOrders: any[]
  initialAnalytics: {
    totalRevenue: number
    totalOrders: number
    takeawayRevenue: number
    takeawayCount: number
    eatInRevenue: number
    eatInCount: number
    cashRevenue: number
    posRevenue: number
    transferRevenue: number
    itemsSold: any[]
    topItems: any[]
  }
  currentUserId: string
  currentUserName: string
  isAdmin: boolean
  initialActiveView?: "counter" | "history"
}

const STATION_META: Record<
  string,
  {
    label: string
    badgeColor: string
    cardAccent: string
    unitLabel: string
  }
> = {
  Rice: {
    label: "Rice Station",
    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    cardAccent: "hover:border-amber-500/50",
    unitLabel: "per scoop / portion",
  },
  Swallow: {
    label: "Swallow",
    badgeColor: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    cardAccent: "hover:border-orange-500/50",
    unitLabel: "per wrap",
  },
  Soups: {
    label: "Soups",
    badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    cardAccent: "hover:border-emerald-500/50",
    unitLabel: "paired w/ swallow",
  },
  Protein: {
    label: "Proteins & Grill",
    badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    cardAccent: "hover:border-rose-500/50",
    unitLabel: "per piece",
  },
  Sides: {
    label: "Sides & Snacks",
    badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    cardAccent: "hover:border-purple-500/50",
    unitLabel: "per portion",
  },
  Extras: {
    label: "Extras & Pack",
    badgeColor: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
    cardAccent: "hover:border-teal-500/50",
    unitLabel: "packaging / add-on",
  },
  Drinks: {
    label: "Chilled Drinks",
    badgeColor: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    cardAccent: "hover:border-sky-500/50",
    unitLabel: "per bottle / cup",
  },
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Rice":
      return <Flame className="w-4 h-4" />
    case "Swallow":
      return <UtensilsCrossed className="w-4 h-4" />
    case "Soups":
      return <Soup className="w-4 h-4" />
    case "Protein":
      return <Drumstick className="w-4 h-4" />
    case "Sides":
      return <Salad className="w-4 h-4" />
    case "Extras":
      return <PackagePlus className="w-4 h-4" />
    case "Drinks":
      return <CupSoda className="w-4 h-4" />
    default:
      return <ShoppingBag className="w-4 h-4" />
  }
}

export function GrabAndGoClient({
  initialCatalog,
  initialOrders,
  initialAnalytics,
  currentUserId,
  currentUserName,
  isAdmin,
  initialActiveView = "counter",
}: GrabAndGoClientProps) {
  const STORAGE_KEY = `tuta_grab_and_go_packs_${currentUserId}`

  const [activeView, setActiveView] = useState<"counter" | "history">(initialActiveView)
  const [catalog, setCatalog] = useState<GrabAndGoMenuItem[]>(initialCatalog)
  const [selectedStation, setSelectedStation] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Multi-pack queue state
  const [packs, setPacks] = useState<CustomerPackTab[]>([
    {
      id: "pack-1",
      label: "Pack #1",
      customerName: "",
      orderType: "TAKEAWAY",
      paymentMethod: "CASH",
      notes: "",
      cart: [],
    },
  ])
  const [activePackId, setActivePackId] = useState<string>("pack-1")
  const [isHydrated, setIsHydrated] = useState(false)

  // Checkout & Receipt state
  const [isPending, startTransition] = useTransition()
  const [checkoutError, setCheckoutError] = useState<string>("")
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  // Sales History state
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [analytics, setAnalytics] = useState(initialAnalytics)
  const [dateFilter, setDateFilter] = useState<string>("today")
  const [historySearch, setHistorySearch] = useState<string>("")
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "CASH" | "POS" | "TRANSFER">("ALL")

  // Catalog Manager state
  const [editingItem, setEditingItem] = useState<GrabAndGoMenuItem | null>(null)
  const [catalogMessage, setCatalogMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setCatalog(initialCatalog)
  }, [initialCatalog])

  // Restore packs from localStorage
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed.packs) && parsed.packs.length > 0) {
          setPacks(parsed.packs)
          setActivePackId(parsed.activePackId || parsed.packs[0].id)
        }
      }
    } catch {
      // Ignore storage errors
    } finally {
      setIsHydrated(true)
    }
  }, [STORAGE_KEY])

  // Persist packs to localStorage
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ packs, activePackId }))
    } catch {
      // Ignore storage errors
    }
  }, [packs, activePackId, isHydrated, STORAGE_KEY])

  const activePack = packs.find((p) => p.id === activePackId) || packs[0]
  const cart = activePack.cart

  const updateActivePack = (updater: (pack: CustomerPackTab) => CustomerPackTab) => {
    setPacks((prev) => prev.map((p) => (p.id === activePack.id ? updater(p) : p)))
  }

  const addItemToPack = (item: GrabAndGoMenuItem, qtyToAdd: number = 1) => {
    setCheckoutError("")
    updateActivePack((pack) => {
      const existing = pack.cart.find((c) => c.item.id === item.id)
      if (existing) {
        return {
          ...pack,
          cart: pack.cart.map((c) =>
            c.item.id === item.id ? { ...c, quantity: c.quantity + qtyToAdd } : c
          ),
        }
      }
      return {
        ...pack,
        cart: [...pack.cart, { item, quantity: qtyToAdd }],
      }
    })
  }

  const decrementItemInPack = (itemId: string) => {
    updateActivePack((pack) => {
      const existing = pack.cart.find((c) => c.item.id === itemId)
      if (!existing) return pack
      if (existing.quantity <= 1) {
        return {
          ...pack,
          cart: pack.cart.filter((c) => c.item.id !== itemId),
        }
      }
      return {
        ...pack,
        cart: pack.cart.map((c) =>
          c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        ),
      }
    })
  }

  const removeItemFromPack = (itemId: string) => {
    updateActivePack((pack) => ({
      ...pack,
      cart: pack.cart.filter((c) => c.item.id !== itemId),
    }))
  }

  const clearCurrentPack = () => {
    updateActivePack((pack) => ({
      ...pack,
      customerName: "",
      notes: "",
      cart: [],
    }))
  }

  const addNewCustomerPack = () => {
    const nextNum = packs.length + 1
    const newId = `pack-${Date.now()}`
    setPacks((prev) => [
      ...prev,
      {
        id: newId,
        label: `Pack #${nextNum}`,
        customerName: "",
        orderType: "TAKEAWAY",
        paymentMethod: "CASH",
        notes: "",
        cart: [],
      },
    ])
    setActivePackId(newId)
  }

  const closeCustomerPack = (packId: string) => {
    if (packs.length <= 1) {
      clearCurrentPack()
      return
    }
    const remaining = packs.filter((p) => p.id !== packId)
    setPacks(remaining)
    if (activePack.id === packId) {
      setActivePackId(remaining[0].id)
    }
  }

  // Smart helpers for Tuta Grab & Go workflow
  const takeawayItem = catalog.find((i) => i.name.toLowerCase().includes("take away"))
  const hasTakeawayInPack = takeawayItem
    ? cart.some((c) => c.item.id === takeawayItem.id)
    : false

  const hasSwallowInPack = cart.some((c) => c.item.category === "Swallow")
  const hasSoupInPack = cart.some((c) => c.item.category === "Soups")
  const soupItems = catalog.filter((i) => i.category === "Soups" && i.isAvailable)

  const packTotalAmount = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0)
  const packTotalPortions = cart.reduce((sum, c) => sum + c.quantity, 0)

  const filteredCatalog = catalog.filter((item) => {
    if (!item.isAvailable) return false
    const matchesStation = selectedStation === "All" || item.category === selectedStation
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStation && matchesSearch
  })

  const handleCompleteOrder = () => {
    if (cart.length === 0) {
      setCheckoutError("Add at least one portion or drink to the pack first.")
      return
    }
    setCheckoutError("")

    const snapshotPack = { ...activePack, cart: [...cart] }
    const snapshotTotal = packTotalAmount

    startTransition(async () => {
      const res = await createGrabAndGoOrder({
        customerName: snapshotPack.customerName || "Walk-in Customer",
        orderType: snapshotPack.orderType,
        paymentMethod: snapshotPack.paymentMethod,
        notes: snapshotPack.notes,
        totalAmount: snapshotTotal,
        items: snapshotPack.cart.map((c) => ({
          itemId: c.item.id,
          name: c.item.name,
          category: c.item.category,
          quantity: c.quantity,
          unitPrice: c.item.price,
          totalPrice: c.item.price * c.quantity,
        })),
      })

      if (res.error) {
        setCheckoutError(res.error)
        return
      }

      const nowStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      setReceiptData({
        storeHeader: "TUTA GRAB & GO",
        title:
          snapshotPack.orderType === "TAKEAWAY"
            ? "GRAB & GO TAKEAWAY"
            : "GRAB & GO EAT-IN",
        orderNumber: res.orderNumber || "GG-0001",
        date: nowStr,
        customerName: snapshotPack.customerName || "Walk-in Customer",
        orderType: `${snapshotPack.orderType === "TAKEAWAY" ? "Takeaway Pack" : "Eat-In Counter"} (${snapshotPack.paymentMethod})`,
        items: snapshotPack.cart.map((c) => ({
          name: c.item.name,
          quantity: c.quantity,
          unitPrice: c.item.price,
          totalPrice: c.item.price * c.quantity,
        })),
        totalAmount: snapshotTotal,
        paymentStatus: `PAID — ${snapshotPack.paymentMethod}`,
      })

      // Refresh today's orders and analytics in background
      const [freshOrders, freshAnalytics] = await Promise.all([
        getGrabAndGoOrders({ dateFilter }),
        getGrabAndGoAnalytics(dateFilter),
      ])
      setOrders(freshOrders)
      setAnalytics(freshAnalytics)

      // Clear completed pack
      if (packs.length > 1) {
        closeCustomerPack(snapshotPack.id)
      } else {
        clearCurrentPack()
      }
    })
  }

  const handleDateFilterChange = (newFilter: string) => {
    setDateFilter(newFilter)
    startTransition(async () => {
      const [freshOrders, freshAnalytics] = await Promise.all([
        getGrabAndGoOrders({ dateFilter: newFilter }),
        getGrabAndGoAnalytics(newFilter),
      ])
      setOrders(freshOrders)
      setAnalytics(freshAnalytics)
    })
  }

  const handleReprintOrder = (order: any) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    setReceiptData({
      storeHeader: "TUTA GRAB & GO",
      title:
        order.orderType === "TAKEAWAY"
          ? "GRAB & GO TAKEAWAY"
          : "GRAB & GO EAT-IN",
      orderNumber: order.orderNumber || order.id.slice(-6).toUpperCase(),
      date: orderDate,
      customerName: order.customerName || "Walk-in Customer",
      orderType: `${order.orderType === "TAKEAWAY" ? "Takeaway Pack" : "Eat-In Counter"} (${order.paymentMethod})`,
      items: (order.items || []).map((i: any) => ({
        name: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      totalAmount: order.totalAmount,
      paymentStatus: `PAID — ${order.paymentMethod || "CASH"}`,
    })
  }

  const handlePrintDailySummary = () => {
    printDailySummary({
      department: "TUTA GRAB & GO COUNTER",
      dateLabel: dateFilter.toUpperCase(),
      totalRevenue: analytics.totalRevenue,
      totalOrders: analytics.totalOrders,
      walkInRevenue: analytics.takeawayRevenue,
      walkInOrdersCount: analytics.takeawayCount,
      roomChargeRevenue: analytics.eatInRevenue,
      roomChargeOrdersCount: analytics.eatInCount,
      itemsSold: analytics.itemsSold.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        revenue: item.revenue,
      })),
    })
  }

  const filteredHistoryOrders = orders.filter((o) => {
    if (paymentFilter !== "ALL" && o.paymentMethod !== paymentFilter) return false
    if (!historySearch.trim()) return true
    const q = historySearch.toLowerCase()
    const matchNum = (o.orderNumber || "").toLowerCase().includes(q)
    const matchCust = (o.customerName || "").toLowerCase().includes(q)
    const matchItems = (o.items || []).some((i: any) =>
      (i.itemName || "").toLowerCase().includes(q)
    )
    return matchNum || matchCust || matchItems
  })

  return (
    <div className="space-y-6">
      {/* DISTINCT FAST-CASUAL EXPRESS BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/90 via-teal-950/85 to-zinc-950 p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-24 -bottom-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Express QSR Counter • Standalone Restaurant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/30">
                <ShoppingBag className="w-7 h-7" />
              </span>
              <span>Tuta Grab &amp; Go</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/75 max-w-2xl">
              Fast-casual scoop &amp; portion counter terminal. Build takeaway packs or eat-in plates with instant 80mm ticket printing — completely separate from Hotel Room Folios.
            </p>
          </div>

          {/* Live Counter Mini-Metrics & View Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-4 px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-300/70 font-bold">
                  Today&apos;s Counter Sales
                </p>
                <p className="text-lg font-black text-emerald-400">
                  ₦{analytics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-300/70 font-bold">
                  Packs Sold
                </p>
                <p className="text-lg font-black text-amber-400">
                  {analytics.totalOrders}
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex p-1 bg-black/50 backdrop-blur-md rounded-2xl border border-white/15">
              <button
                onClick={() => setActiveView("counter")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                  activeView === "counter"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Counter</span>
              </button>

              <button
                onClick={() => setActiveView("history")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                  activeView === "history"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Sales ({orders.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: EXPRESS COUNTER (BUILD-A-PACK TERMINAL)
         ===================================================================== */}
      {activeView === "counter" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLS: FOOD STATIONS & PORTION CARDS */}
          <div className="lg:col-span-8 space-y-5">
            {/* Station Category Bar & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card border border-border/80 p-3 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                <button
                  onClick={() => setSelectedStation("All")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedStation === "All"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>All Stations ({catalog.filter((i) => i.isAvailable).length})</span>
                </button>

                {GRAB_AND_GO_CATEGORIES.map((category) => {
                  const count = catalog.filter(
                    (i) => i.category === category && i.isAvailable
                  ).length
                  const isSelected = selectedStation === category
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedStation(category)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {getCategoryIcon(category)}
                      <span>{category}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? "bg-black/25 text-white"
                            : "bg-background text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search dish..."
                  className="pl-9 h-9 text-xs rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Smart Swallow -> Soup Pairing Prompt */}
            {hasSwallowInPack && !hasSoupInPack && soupItems.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Soup className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      Swallow is in the pack — Pair with a Soup:
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Tap below to add soup to this customer&apos;s swallow order
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {soupItems.map((soup) => (
                    <Button
                      key={soup.id}
                      size="sm"
                      onClick={() => addItemToPack(soup, 1)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-8 gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {soup.name} {soup.price > 0 ? `(₦${soup.price})` : "(Free)"}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Station Groups or Filtered Grid */}
            {selectedStation === "All" && !searchQuery ? (
              <div className="space-y-6">
                {GRAB_AND_GO_CATEGORIES.map((category) => {
                  const stationItems = filteredCatalog.filter(
                    (i) => i.category === category
                  )
                  if (stationItems.length === 0) return null
                  const meta = STATION_META[category] || {
                    label: category,
                    badgeColor: "bg-emerald-500/15 text-emerald-500",
                    cardAccent: "hover:border-emerald-500/50",
                    unitLabel: "per portion",
                  }

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider border ${meta.badgeColor}`}
                          >
                            {getCategoryIcon(category)}
                            {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            • {meta.unitLabel}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {stationItems.map((item) => {
                          const inPack = cart.find((c) => c.item.id === item.id)
                          const qty = inPack?.quantity || 0
                          return (
                            <StationItemCard
                              key={item.id}
                              item={item}
                              quantityInPack={qty}
                              onAddOne={() => addItemToPack(item, 1)}
                              onAddTwo={() => addItemToPack(item, 2)}
                              onDecrement={() => decrementItemInPack(item.id)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredCatalog.map((item) => {
                  const inPack = cart.find((c) => c.item.id === item.id)
                  const qty = inPack?.quantity || 0
                  return (
                    <StationItemCard
                      key={item.id}
                      item={item}
                      quantityInPack={qty}
                      onAddOne={() => addItemToPack(item, 1)}
                      onAddTwo={() => addItemToPack(item, 2)}
                      onDecrement={() => decrementItemInPack(item.id)}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* RIGHT 4 COLS: ACTIVE CUSTOMER PACK & INSTANT CHECKOUT */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <Card className="border-2 border-emerald-500/30 shadow-xl overflow-hidden rounded-3xl">
              {/* Customer Pack Queue Tabs */}
              <div className="bg-emerald-950/90 text-white p-3 border-b border-white/10">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Active Customer Queue
                  </span>
                  <button
                    onClick={addNewCustomerPack}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[11px] font-bold border border-emerald-400/30 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Hold / New Pack
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {packs.map((p) => {
                    const isCurrent = p.id === activePack.id
                    const count = p.cart.reduce((s, c) => s + c.quantity, 0)
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
                          isCurrent
                            ? "bg-emerald-500 text-black shadow-sm"
                            : "bg-white/10 text-zinc-300 hover:bg-white/15"
                        }`}
                        onClick={() => setActivePackId(p.id)}
                      >
                        <span>{p.label}</span>
                        {count > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                              isCurrent ? "bg-black text-emerald-400" : "bg-emerald-500/30 text-white"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                        {packs.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              closeCustomerPack(p.id)
                            }}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <CardContent className="p-4 space-y-4">
                {/* Order Mode Switcher: Takeaway vs Eat-In */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl">
                  <button
                    type="button"
                    onClick={() =>
                      updateActivePack((p) => ({ ...p, orderType: "TAKEAWAY" }))
                    }
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                      activePack.orderType === "TAKEAWAY"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Grab &amp; Go Pack</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateActivePack((p) => ({ ...p, orderType: "EAT_IN" }))
                    }
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                      activePack.orderType === "EAT_IN"
                        ? "bg-amber-500 text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Eat-In Plate</span>
                  </button>
                </div>

                {/* Quick 1-Tap Takeaway Container Button */}
                {takeawayItem && activePack.orderType === "TAKEAWAY" && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <div className="text-xs">
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        Take Away Pack (₦{takeawayItem.price})
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {hasTakeawayInPack
                          ? "Included in customer pack"
                          : "Need a takeaway container?"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={hasTakeawayInPack ? "outline" : "default"}
                      onClick={() => addItemToPack(takeawayItem, 1)}
                      className={
                        hasTakeawayInPack
                          ? "h-7 text-xs border-amber-500/40 text-amber-600 dark:text-amber-300"
                          : "h-7 text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold"
                      }
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {hasTakeawayInPack ? "Add Another (+₦300)" : "Add Pack (+₦300)"}
                    </Button>
                  </div>
                )}

                {/* Customer Name / Order Tag */}
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={activePack.customerName}
                    onChange={(e) =>
                      updateActivePack((p) => ({ ...p, customerName: e.target.value }))
                    }
                    placeholder="Customer Name / Tag (Optional)"
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>

                {/* Itemized Portions List */}
                <div className="border border-border/80 rounded-2xl overflow-hidden">
                  <div className="bg-muted/60 px-3.5 py-2 flex items-center justify-between border-b border-border/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Pack Contents ({packTotalPortions} portions)
                    </span>
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={clearCurrentPack}
                        className="text-[11px] font-semibold text-red-500 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-10 px-4 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        Pack is Empty
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
                        Tap Rice, Swallow, Soups, Proteins, Sides, or Drinks on the left to build the meal pack.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[270px] overflow-y-auto divide-y divide-border/50 custom-scrollbar">
                      {cart.map(({ item, quantity }) => (
                        <div
                          key={item.id}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-muted/30 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold truncate">{item.name}</p>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {item.price === 0
                                ? "Free w/ Swallow"
                                : `₦${item.price.toLocaleString()} × ${quantity}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => decrementItemInPack(item.id)}
                              className="w-6 h-6 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => addItemToPack(item, 1)}
                              className="w-6 h-6 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right min-w-[64px]">
                            <p className="text-xs font-black">
                              ₦{(item.price * quantity).toLocaleString()}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeItemFromPack(item.id)}
                              className="text-[10px] text-red-500/80 hover:text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Payment Method
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateActivePack((p) => ({ ...p, paymentMethod: "CASH" }))
                      }
                      className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                        activePack.paymentMethod === "CASH"
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Banknote className="w-4 h-4 mb-0.5" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateActivePack((p) => ({ ...p, paymentMethod: "POS" }))
                      }
                      className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                        activePack.paymentMethod === "POS"
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mb-0.5" />
                      <span>POS Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateActivePack((p) => ({ ...p, paymentMethod: "TRANSFER" }))
                      }
                      className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                        activePack.paymentMethod === "TRANSFER"
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mb-0.5" />
                      <span>Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Grand Total Banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 to-zinc-900 text-white flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">
                      Total Amount Due
                    </p>
                    <p className="text-xs text-zinc-400">
                      {activePack.orderType === "TAKEAWAY" ? "Grab & Go Pack" : "Eat-In"} •{" "}
                      {activePack.paymentMethod}
                    </p>
                  </div>
                  <p className="text-2xl font-black text-emerald-400">
                    ₦{packTotalAmount.toLocaleString()}
                  </p>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                    {checkoutError}
                  </div>
                )}

                <Button
                  type="button"
                  disabled={isPending || cart.length === 0}
                  onClick={handleCompleteOrder}
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-emerald-600/25 gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Ticket...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Complete &amp; Print Grab &amp; Go Ticket
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: SALES HISTORY & DAILY COUNTER SUMMARY
         ===================================================================== */}
      {activeView === "history" && (
        <div className="space-y-6">
          {/* Date Filter & Print Daily Summary Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/80 p-4 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "today", label: "Today" },
                { key: "yesterday", label: "Yesterday" },
                { key: "week", label: "Last 7 Days" },
                { key: "month", label: "This Month" },
                { key: "all", label: "All Time" },
              ].map((period) => (
                <Button
                  key={period.key}
                  size="sm"
                  variant={dateFilter === period.key ? "default" : "outline"}
                  onClick={() => handleDateFilterChange(period.key)}
                  className={
                    dateFilter === period.key
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                      : "rounded-xl"
                  }
                >
                  {period.label}
                </Button>
              ))}
            </div>

            <Button
              onClick={handlePrintDailySummary}
              variant="outline"
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-xl gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Counter Summary (80mm)
            </Button>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-emerald-500/25">
              <CardContent className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Grab &amp; Go Revenue
                </p>
                <p className="text-2xl font-black text-emerald-500 mt-1">
                  ₦{analytics.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {analytics.totalOrders} completed packs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cash Payments
                </p>
                <p className="text-2xl font-black mt-1">
                  ₦{analytics.cashRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Physical cash collected at counter
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  POS Terminal / Card
                </p>
                <p className="text-2xl font-black mt-1">
                  ₦{analytics.posRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Card transactions at counter
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Bank Transfers
                </p>
                <p className="text-2xl font-black mt-1">
                  ₦{analytics.transferRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Takeaway ({analytics.takeawayCount}) • Eat-In ({analytics.eatInCount})
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling Portions + Order History Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Top Selling Portions
                </CardTitle>
                <CardDescription>
                  Most popular dishes sold at Tuta Grab &amp; Go
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {analytics.itemsSold.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No portions sold in this period yet.
                  </p>
                ) : (
                  analytics.itemsSold.map((item: any, idx: number) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 font-black flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black">{item.quantity} sold</p>
                        <p className="text-[10px] text-emerald-500 font-bold">
                          ₦{item.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-8">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    Grab &amp; Go Order Tickets
                  </CardTitle>
                  <CardDescription>
                    Click any ticket to preview or reprint the 80mm thermal receipt
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as any)}
                    className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                  >
                    <option value="ALL">All Payments</option>
                    <option value="CASH">Cash Only</option>
                    <option value="POS">POS Only</option>
                    <option value="TRANSFER">Transfer Only</option>
                  </select>
                  <Input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search ticket # or dish..."
                    className="h-9 text-xs w-44 rounded-xl"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredHistoryOrders.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No Grab &amp; Go tickets match your filter.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredHistoryOrders.map((order: any) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl border border-border/80 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs font-bold">
                              {order.customerName || "Walk-in Customer"}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-semibold">
                              {order.orderType === "TAKEAWAY" ? "🥡 Takeaway" : "🍽️ Eat-In"}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                              {order.paymentMethod}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(order.items || [])
                              .map((i: any) => `${i.quantity}x ${i.itemName}`)
                              .join(", ")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString()} • Cashier:{" "}
                            {order.cashierName || "Staff"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <p className="text-base font-black text-emerald-500">
                            ₦{order.totalAmount.toLocaleString()}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReprintOrder(order)}
                            className="rounded-xl text-xs gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 80MM THERMAL RECEIPT MODAL */}
      <ThermalReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  )
}

function StationItemCard({
  item,
  quantityInPack,
  onAddOne,
  onAddTwo,
  onDecrement,
}: {
  item: GrabAndGoMenuItem
  quantityInPack: number
  onAddOne: () => void
  onAddTwo: () => void
  onDecrement: () => void
}) {
  const isSelected = quantityInPack > 0
  const showQuickDouble =
    item.category === "Rice" ||
    item.category === "Swallow" ||
    item.category === "Protein"

  return (
    <div
      onClick={onAddOne}
      className={`group relative rounded-2xl border p-3.5 transition-all cursor-pointer select-none flex flex-col justify-between min-h-[120px] ${
        isSelected
          ? "border-2 border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10"
          : "border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-md"
      }`}
    >
      {/* Top Row: Category & Quantity Badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {item.category}
        </span>
        {isSelected ? (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-black text-xs shadow-sm">
            {quantityInPack}×
          </span>
        ) : (
          <span className="w-6 h-6 rounded-lg bg-muted group-hover:bg-emerald-500 group-hover:text-black flex items-center justify-center transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Item Name & Price */}
      <div className="my-2">
        <p className="font-extrabold text-sm leading-snug text-foreground">
          {item.name}
        </p>
        <p
          className={`text-sm font-black mt-0.5 ${
            item.price === 0
              ? "text-emerald-500"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {item.price === 0 ? "FREE" : `₦${item.price.toLocaleString()}`}
        </p>
      </div>

      {/* Bottom Action Controls */}
      <div
        className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {isSelected ? (
          <div className="flex items-center justify-between w-full gap-1">
            <button
              type="button"
              onClick={onDecrement}
              className="h-7 px-2.5 rounded-lg bg-background border border-border hover:bg-muted text-xs font-bold flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              ₦{(item.price * quantityInPack).toLocaleString()}
            </span>
            <button
              type="button"
              onClick={onAddOne}
              className="h-7 px-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-1">
            <button
              type="button"
              onClick={onAddOne}
              className="flex-1 h-7 rounded-lg bg-muted/80 hover:bg-emerald-500 hover:text-black text-[11px] font-bold transition-colors"
            >
              +1 Portion
            </button>
            {showQuickDouble && (
              <button
                type="button"
                onClick={onAddTwo}
                className="px-2 h-7 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-black text-amber-600 dark:text-amber-400 text-[11px] font-extrabold transition-colors"
                title="Add 2 portions"
              >
                +2
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
