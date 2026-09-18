"use client"

import { useState, useTransition, useEffect } from "react"
import { createUnifiedPOSOrder, POSCartItem, saveUserPOSDrafts } from "@/app/actions/unified-pos-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Minus, 
  Plus, 
  ShoppingCart, 
  Trash2, 
  Loader2, 
  Utensils, 
  Wine, 
  User, 
  BedDouble, 
  ChevronRight, 
  X as XIcon, 
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  BookmarkCheck,
  RotateCcw
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ThermalReceiptModal, ReceiptData } from "@/components/thermal-receipt-modal"

interface OrderTab {
  id: string
  name: string
  cart: {
    item: any
    catalogType: "RESTAURANT" | "BAR"
    quantity: number
    customPrice?: number
  }[]
  orderType: "WALKIN" | "ROOM"
  customerName: string
  selectedRoomId: string
  isSaved?: boolean
  savedAt?: string
}

interface UnifiedPOSClientProps {
  foodCatalog: any[]
  drinksCatalog: any[]
  occupiedRooms: any[]
  currentUserId: string
  currentUserName: string
  initialSavedTabs?: OrderTab[]
  importOrderTab?: any
  onImportComplete?: () => void
}

export function UnifiedPOSClient({
  foodCatalog,
  drinksCatalog,
  occupiedRooms,
  currentUserId,
  currentUserName,
  initialSavedTabs,
  importOrderTab,
  onImportComplete,
}: UnifiedPOSClientProps) {
  const STORAGE_KEY = `tuta_pos_orders_v2_${currentUserId}`

  // Multi-tab order state
  const [tabs, setTabs] = useState<OrderTab[]>([
    { id: "tab-1", name: "Order #1", cart: [], orderType: "WALKIN", customerName: "", selectedRoomId: "" }
  ])
  const [activeTabId, setActiveTabId] = useState<string>("tab-1")
  const [isHydrated, setIsHydrated] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // Handle taking over / importing an order tab from Admin Pending Orders view
  useEffect(() => {
    if (importOrderTab && importOrderTab.id) {
      setTabs((prev) => {
        const exists = prev.some((t) => t.id === importOrderTab.id)
        if (exists) {
          return prev.map((t) => (t.id === importOrderTab.id ? importOrderTab : t))
        }
        return [...prev, importOrderTab]
      })
      setActiveTabId(importOrderTab.id)
      setSaveFeedback(`Imported pending order "${importOrderTab.name || 'Order'}" into active terminal.`)
      setTimeout(() => setSaveFeedback(null), 5000)
      if (onImportComplete) onImportComplete()
    }
  }, [importOrderTab, onImportComplete])

  // 1. HYDRATION: Restore this specific user's active in-progress orders
  useEffect(() => {
    try {
      const local = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      if (local) {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
          setTabs(parsed.tabs)
          if (parsed.activeTabId && parsed.tabs.some((t: OrderTab) => t.id === parsed.activeTabId)) {
            setActiveTabId(parsed.activeTabId)
          } else {
            setActiveTabId(parsed.tabs[0].id)
          }
          setIsHydrated(true)
          return
        }
      }
      // Fallback: Check server-backed user drafts
      if (initialSavedTabs && initialSavedTabs.length > 0) {
        setTabs(initialSavedTabs)
        setActiveTabId(initialSavedTabs[0].id)
      }
    } catch (err) {
      console.warn("Could not restore user POS session:", err)
    } finally {
      setIsHydrated(true)
    }
  }, [STORAGE_KEY])

  // 2. CONTINUOUS AUTO-SAVE: Auto-persist cart changes so navigation never loses active orders
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeTabId }))
    } catch (err) {
      console.warn("Error auto-saving POS orders:", err)
    }
  }, [tabs, activeTabId, isHydrated, STORAGE_KEY])

  // Menu view switcher: "RESTAURANT" (Food) | "BAR" (Drinks) | "ALL"
  const [menuView, setMenuView] = useState<"RESTAURANT" | "BAR" | "ALL">("RESTAURANT")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)

  // Current active tab object
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  const cart = activeTab.cart
  const orderType = activeTab.orderType
  const customerName = activeTab.customerName
  const selectedRoomId = activeTab.selectedRoomId

  // Helper to update active tab
  const updateActiveTab = (updates: Partial<OrderTab>) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTab.id ? { ...t, ...updates } : t)))
  }

  // Multi-tab actions
  const createNewTab = () => {
    const newId = `tab-${Date.now()}`
    const newName = `Order #${tabs.length + 1}`
    const newTab: OrderTab = { id: newId, name: newName, cart: [], orderType: "WALKIN", customerName: "", selectedRoomId: "" }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newId)
  }

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabs.length === 1) {
      setTabs([{ id: "tab-1", name: "Order #1", cart: [], orderType: "WALKIN", customerName: "", selectedRoomId: "" }])
      setActiveTabId("tab-1")
      return
    }
    const remaining = tabs.filter((t) => t.id !== tabId)
    setTabs(remaining)
    if (activeTabId === tabId) {
      setActiveTabId(remaining[remaining.length - 1].id)
    }
  }

  // Determine current active catalog items
  const combinedCatalog = [
    ...foodCatalog.map((i) => ({ ...i, catalogType: "RESTAURANT" as const })),
    ...drinksCatalog.map((i) => ({ ...i, catalogType: "BAR" as const })),
  ]

  const activeCatalog = menuView === "ALL" 
    ? combinedCatalog 
    : menuView === "RESTAURANT" 
    ? foodCatalog 
    : drinksCatalog

  // Available categories based on current active view
  const categories = ["All", ...Array.from(new Set(activeCatalog.map((c) => c.category)))]

  // Filtered items
  const filteredItems = activeCatalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    const matchesCat = categoryFilter === "All" || item.category === categoryFilter
    return matchesSearch && matchesCat
  })

  // Cart operations
  const addToCart = (item: any, catalogType: "RESTAURANT" | "BAR") => {
    const updatedCart = (() => {
      const existing = cart.find((i) => i.item.id === item.id && i.catalogType === catalogType)
      if (existing) {
        return cart.map((i) =>
          i.item.id === item.id && i.catalogType === catalogType
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [
        ...cart,
        {
          item,
          catalogType,
          quantity: 1,
          customPrice: item.price === 0 ? 0 : undefined,
        },
      ]
    })()
    updateActiveTab({ cart: updatedCart })
  }

  const updateQuantity = (itemId: string, catalogType: string, delta: number) => {
    const updatedCart = cart
      .map((i) => {
        if (i.item.id === itemId && i.catalogType === catalogType) {
          const newQ = Math.max(0, i.quantity + delta)
          return { ...i, quantity: newQ }
        }
        return i
      })
      .filter((i) => i.quantity > 0)
    updateActiveTab({ cart: updatedCart })
  }

  const updateCustomPrice = (itemId: string, catalogType: string, price: number) => {
    const updatedCart = cart.map((i) => {
      if (i.item.id === itemId && i.catalogType === catalogType) {
        return { ...i, customPrice: price }
      }
      return i
    })
    updateActiveTab({ cart: updatedCart })
  }

  const handleCustomerNameChange = (name: string) => {
    const tabIndex = tabs.findIndex((t) => t.id === activeTab.id) + 1
    const newTabName = name.trim() ? name.trim() : `Order #${tabIndex}`
    updateActiveTab({ customerName: name, name: newTabName })
  }

  const handleRoomChange = (roomId: string) => {
    const roomObj = occupiedRooms.find((r) => r.id === roomId)
    const tabIndex = tabs.findIndex((t) => t.id === activeTab.id) + 1
    const newTabName = roomObj ? `Room ${roomObj.number}` : `Order #${tabIndex}`
    updateActiveTab({ selectedRoomId: roomId, name: newTabName })
  }

  // Totals
  const foodSubtotal = cart
    .filter((c) => c.catalogType === "RESTAURANT")
    .reduce((sum, c) => sum + (c.customPrice ?? c.item.price) * c.quantity, 0)

  const drinksSubtotal = cart
    .filter((c) => c.catalogType === "BAR")
    .reduce((sum, c) => sum + (c.customPrice ?? c.item.price) * c.quantity, 0)

  const grandTotal = foodSubtotal + drinksSubtotal
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Explicit Save / Hold Order (active in-progress order)
  const handleSaveCurrentOrder = async () => {
    if (cart.length === 0) {
      setError("Please add at least one item to the cart before holding or saving this order.")
      return
    }
    setError("")
    setIsSavingDraft(true)
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const updatedTabs = tabs.map((t) =>
      t.id === activeTab.id
        ? { ...t, isSaved: true, savedAt: timeStr }
        : t
    )
    setTabs(updatedTabs)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs: updatedTabs, activeTabId }))
      }
      await saveUserPOSDrafts(updatedTabs)
      setSaveFeedback(`Order "${activeTab.name}" has been held active at ${timeStr}. You can navigate to other modules and return anytime.`)
      setTimeout(() => setSaveFeedback(null), 6000)
    } catch (err) {
      console.error("Failed to hold draft:", err)
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Clear / Discard Current Tab
  const handleClearCurrentCart = () => {
    if (!confirm(`Are you sure you want to clear "${activeTab.name}"?`)) return
    const tabIndex = tabs.findIndex((t) => t.id === activeTab.id) + 1
    const updatedTabs = tabs.map((t) =>
      t.id === activeTab.id
        ? {
            ...t,
            cart: [],
            customerName: "",
            selectedRoomId: "",
            orderType: "WALKIN" as const,
            isSaved: false,
            savedAt: undefined,
            name: `Order #${tabIndex}`,
          }
        : t
    )
    setTabs(updatedTabs)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs: updatedTabs, activeTabId }))
    }
    saveUserPOSDrafts(updatedTabs)
    setSaveFeedback(null)
  }

  // Single-step Checkout
  const handleCheckout = () => {
    setError("")
    setSuccess(false)

    if (cart.length === 0) return
    if (orderType === "ROOM" && !selectedRoomId) {
      setError("Please select an occupied room to charge this order to.")
      return
    }

    const hasMissingPrices = cart.some(
      (c) => c.item.price === 0 && (c.customPrice === undefined || c.customPrice <= 0)
    )
    if (hasMissingPrices) {
      setError("Please enter a valid price for 'Price on Request' items.")
      return
    }

    startTransition(async () => {
      const payloadItems: POSCartItem[] = cart.map((c) => {
        const unitPrice = c.customPrice ?? c.item.price
        return {
          itemId: c.item.id,
          name: c.item.name,
          catalogType: c.catalogType,
          category: c.item.category || (c.catalogType === "RESTAURANT" ? "Food" : "Drinks"),
          quantity: c.quantity,
          unitPrice,
          totalPrice: unitPrice * c.quantity,
        }
      })

      const res = await createUnifiedPOSOrder({
        isWalkIn: orderType === "WALKIN",
        customerName: orderType === "WALKIN" ? customerName : undefined,
        reservationId:
          orderType === "ROOM"
            ? occupiedRooms.find((r) => r.id === selectedRoomId)?.reservations[0]?.id
            : undefined,
        items: payloadItems,
        totalAmount: grandTotal,
      })

      if (res.error) {
        setError(res.error)
      } else if (res.receiptData) {
        setSuccess(true)
        setReceiptData(res.receiptData as ReceiptData)

        // Once order completes successfully, remove this tab or reset if it was the only one
        let updatedTabs: OrderTab[]
        let nextTabId: string

        if (tabs.length > 1) {
          updatedTabs = tabs.filter((t) => t.id !== activeTab.id)
          nextTabId = updatedTabs[0].id
        } else {
          updatedTabs = [
            { id: "tab-1", name: "Order #1", cart: [], orderType: "WALKIN", customerName: "", selectedRoomId: "" }
          ]
          nextTabId = "tab-1"
        }

        setTabs(updatedTabs)
        setActiveTabId(nextTabId)

        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs: updatedTabs, activeTabId: nextTabId }))
        }
        saveUserPOSDrafts(updatedTabs)
        setIsMobileCartOpen(false)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ── 1. USER IDENTITY & MULTI-ORDER TABS HEADER ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar flex-1 pb-1 sm:pb-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            const tabItemsCount = tab.cart.reduce((sum, i) => sum + i.quantity, 0)
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 shrink-0 border select-none ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <span>{tab.name}</span>
                {tabItemsCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-black text-primary" : "bg-primary/20 text-primary"
                    }`}
                  >
                    {tabItemsCount}
                  </span>
                )}
                {tab.isSaved && (
                  <span
                    title={`Active draft saved at ${tab.savedAt || "recent"}`}
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                      isActive
                        ? "bg-black/30 text-white"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    ● Active
                  </span>
                )}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className={`p-0.5 rounded-full transition-colors ml-1 ${
                      isActive ? "hover:bg-black/20 text-primary-foreground" : "hover:bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}
          <Button
            onClick={createNewTab}
            variant="outline"
            size="sm"
            className="rounded-xl border-dashed border-border/60 hover:border-primary text-xs font-bold flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Tab</span>
          </Button>
        </div>

        {/* User Scope Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground shrink-0 self-start sm:self-auto shadow-sm">
          <User className="w-3.5 h-3.5 text-primary" />
          <span>Session: <strong className="text-foreground">{currentUserName}</strong></span>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
            Private Order Draft
          </span>
        </div>
      </div>

      {/* ── TOP MOBILE QUICK ACTION BAR (Visible on Phones & Tablets) ───── */}
      <div className="lg:hidden flex items-center justify-between p-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/70 shadow-sm gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-foreground truncate flex items-center gap-1.5">
              <span>{activeTab.name}</span>
              {activeTab.isSaved && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ● Held Active
                </span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">
              {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} • <strong className="text-primary">₦{grandTotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Top Mobile Hold / Save Order Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveCurrentOrder}
            disabled={cart.length === 0 || isSavingDraft}
            className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              activeTab.isSaved 
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                : "bg-background/80 hover:bg-card border-primary/40 text-foreground"
            }`}
          >
            {isSavingDraft ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : (
              <BookmarkCheck className={`w-3.5 h-3.5 ${activeTab.isSaved ? "text-emerald-500" : "text-primary"}`} />
            )}
            <span>{activeTab.isSaved ? "Held" : "Hold / Save"}</span>
          </Button>

          {/* Quick Cart Trigger */}
          <Button
            type="button"
            size="sm"
            onClick={() => setIsMobileCartOpen(true)}
            className="h-9 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Cart</span>
          </Button>
        </div>
      </div>

      {/* Mobile Save Feedback Toast Banner */}
      {saveFeedback && (
        <div className="lg:hidden p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <BookmarkCheck className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="leading-tight">{saveFeedback}</span>
        </div>
      )}

      {/* ── 2. POS MAIN WORKSPACE ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CATALOG & MENU BROWSER (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* A. SWITCHABLE MENU TABS (FOOD vs DRINKS) */}
          <div className="bg-card/70 backdrop-blur-md p-3 rounded-2xl border border-border/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-muted/80 rounded-xl border border-border/60 w-full sm:w-auto">
              <button
                onClick={() => {
                  setMenuView("RESTAURANT")
                  setCategoryFilter("All")
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  menuView === "RESTAURANT"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Utensils className="w-4 h-4" />
                Restaurant Menu
              </button>
              <button
                onClick={() => {
                  setMenuView("BAR")
                  setCategoryFilter("All")
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  menuView === "BAR"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wine className="w-4 h-4" />
                Drinks Catalogue
              </button>
              <button
                onClick={() => {
                  setMenuView("ALL")
                  setCategoryFilter("All")
                }}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  menuView === "ALL"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-4 h-4" />
                All Items
              </button>
            </div>

            {/* Quick search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${menuView === "BAR" ? "drinks" : menuView === "RESTAURANT" ? "food" : "all items"}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/80 rounded-xl text-xs h-10 border-border/60 focus:border-primary"
              />
            </div>
          </div>

          {/* B. CATEGORY FILTER PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  categoryFilter === cat
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* C. ITEM CARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-28 lg:pb-0">
            {filteredItems.map((item) => {
              const isFood = item.catalogType === "RESTAURANT"
              const isZeroPrice = item.price === 0
              const inCart = cart.find(
                (c) => c.item.id === item.id && c.catalogType === item.catalogType
              )

              return (
                <div
                  key={`${item.catalogType}-${item.id}`}
                  onClick={() => addToCart(item, item.catalogType)}
                  className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                    inCart
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-card/70 hover:bg-card hover:border-primary/50 border-border/60 shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isFood
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                        }`}
                      >
                        {isFood ? <Utensils className="w-2.5 h-2.5" /> : <Wine className="w-2.5 h-2.5" />}
                        {isFood ? "Food" : "Drink"}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                        {item.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-primary">
                      {isZeroPrice ? (
                        <span className="text-xs text-amber-500 font-bold">Custom Price</span>
                      ) : (
                        `₦${item.price.toLocaleString()}`
                      )}
                    </span>

                    {inCart ? (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-black font-extrabold text-xs">
                        {inCart.quantity}
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-muted/80 group-hover:bg-primary group-hover:text-black transition-colors flex items-center justify-center text-muted-foreground">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                <p className="text-sm font-medium">No items found matching &quot;{search}&quot;</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: UNIFIED ORDER CART (4 cols, Desktop) */}
        <div className="hidden lg:block lg:col-span-4">
          <Card className="sticky top-6 rounded-2xl border-border/60 shadow-lg overflow-hidden bg-card/80 backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span>{activeTab.name}</span>
                </CardTitle>
                <span className="text-xs font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                  {totalItemsCount} items
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Order Type Toggle: Walk-in vs Room Charge */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40">
                <button
                  onClick={() => updateActiveTab({ orderType: "WALKIN" })}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderType === "WALKIN"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Walk-in Guest
                </button>
                <button
                  onClick={() => updateActiveTab({ orderType: "ROOM" })}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderType === "ROOM"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BedDouble className="w-3.5 h-3.5" />
                  Room Bill
                </button>
              </div>

              {/* Customer Name or Room Selection */}
              {orderType === "WALKIN" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Customer Name / Table (Optional)
                  </label>
                  <Input
                    placeholder="e.g. John Doe, Table 4"
                    value={customerName}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-background/80 border-border/60"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Select Occupied Room
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-background border border-border/60 text-xs font-medium focus:border-primary outline-none"
                  >
                    <option value="">-- Choose Room --</option>
                    {occupiedRooms.map((room) => {
                      const guest = room.reservations?.[0]?.guest
                      return (
                        <option key={room.id} value={room.id}>
                          Room {room.number} — {guest ? `${guest.firstName} ${guest.lastName}` : "Occupied"}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {cart.map((c) => {
                  const isFood = c.catalogType === "RESTAURANT"
                  const isZeroPrice = c.item.price === 0
                  const itemUnitPrice = c.customPrice ?? c.item.price

                  return (
                    <div
                      key={`${c.catalogType}-${c.item.id}`}
                      className="p-2.5 rounded-xl bg-muted/40 border border-border/40 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span
                            className={`p-1 rounded text-[9px] shrink-0 font-bold ${
                              isFood
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            }`}
                          >
                            {isFood ? "Food" : "Drink"}
                          </span>
                          <span className="font-bold text-xs text-foreground truncate">
                            {c.item.name}
                          </span>
                        </div>
                        <span className="font-extrabold text-xs text-primary shrink-0">
                          ₦{(itemUnitPrice * c.quantity).toLocaleString()}
                        </span>
                      </div>

                      {/* Custom price entry for Price on Request items */}
                      {isZeroPrice && (
                        <div className="flex items-center gap-2 pt-1 border-t border-border/20">
                          <span className="text-[10px] text-muted-foreground font-bold shrink-0">Unit Price: ₦</span>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Enter price"
                            value={c.customPrice || ""}
                            onChange={(e) =>
                              updateCustomPrice(c.item.id, c.catalogType, parseFloat(e.target.value) || 0)
                            }
                            className="h-7 text-xs rounded-lg bg-background"
                          />
                        </div>
                      )}

                      {/* Quantity buttons & remove */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted-foreground">
                          @ ₦{itemUnitPrice.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(c.item.id, c.catalogType, -1)}
                            className="w-6 h-6 rounded-lg bg-background border border-border/60 hover:border-primary flex items-center justify-center text-foreground transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-extrabold w-5 text-center">{c.quantity}</span>
                          <button
                            onClick={() => updateQuantity(c.item.id, c.catalogType, 1)}
                            className="w-6 h-6 rounded-lg bg-background border border-border/60 hover:border-primary flex items-center justify-center text-foreground transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => updateQuantity(c.item.id, c.catalogType, -c.quantity)}
                            className="w-6 h-6 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center ml-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {cart.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-xs">
                    Cart is empty. Click items from the menu to add.
                  </div>
                )}
              </div>

              {/* Subtotal & Grand Total Breakdown */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-border/40 space-y-1.5 text-xs">
                  {foodSubtotal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Kitchen &amp; Food Subtotal:</span>
                      <span className="font-bold">₦{foodSubtotal.toLocaleString()}</span>
                    </div>
                  )}
                  {drinksSubtotal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Bar &amp; Drinks Subtotal:</span>
                      <span className="font-bold">₦{drinksSubtotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-foreground pt-1 border-t border-border/40">
                    <span>Grand Total:</span>
                    <span className="text-primary text-base">₦{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Save Feedback Banner */}
              {saveFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="leading-tight">{saveFeedback}</span>
                </div>
              )}

              {/* Error notification */}
              {error && (
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Action Buttons: Save/Hold Draft & Clear */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveCurrentOrder}
                  disabled={cart.length === 0 || isSavingDraft}
                  className="h-9 rounded-xl border-border/70 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-muted"
                >
                  {isSavingDraft ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <BookmarkCheck className={`w-3.5 h-3.5 ${activeTab.isSaved ? "text-emerald-500" : "text-primary"}`} />
                  )}
                  <span>{activeTab.isSaved ? "Order Held Active" : "Hold / Save Order"}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearCurrentCart}
                  disabled={cart.length === 0}
                  className="h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Cart</span>
                </Button>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={isPending || cart.length === 0}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Order (₦{grandTotal.toLocaleString()})</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 3. SUPER MOBILE-FRIENDLY DUAL FLOATING BAR ───────────────────── */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 flex items-center gap-2">
        {/* Mobile Floating Button 1: Hold / Save Order (Always visible on mobile!) */}
        <Button
          type="button"
          onClick={handleSaveCurrentOrder}
          disabled={cart.length === 0 || isSavingDraft}
          className={`h-14 px-4 rounded-2xl border font-black text-xs flex flex-col items-center justify-center gap-0.5 shadow-2xl shrink-0 transition-all ${
            activeTab.isSaved
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/25 active:scale-95"
              : "bg-card/95 backdrop-blur-2xl text-foreground border-primary/50 hover:bg-card active:scale-95"
          }`}
        >
          {isSavingDraft ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <BookmarkCheck className={`w-4 h-4 ${activeTab.isSaved ? "text-white" : "text-emerald-500"}`} />
          )}
          <span className="text-[10px] leading-tight">
            {activeTab.isSaved ? "Held Active" : "Hold / Save"}
          </span>
        </Button>

        {/* Mobile Floating Button 2: Cart & Checkout Trigger */}
        <Button
          type="button"
          onClick={() => setIsMobileCartOpen(true)}
          className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold flex items-center justify-between px-4 text-sm shadow-2xl active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-black text-primary text-[10px] font-black flex items-center justify-center border border-primary">
                  {totalItemsCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-none">{activeTab.name}</div>
              <div className="text-[10px] opacity-85 font-normal leading-none mt-1">
                {totalItemsCount === 0 ? "Cart is Empty" : `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'}`}
              </div>
            </div>
          </div>
          <span className="text-base font-extrabold font-mono">₦{grandTotal.toLocaleString()}</span>
        </Button>
      </div>

      {/* Mobile Drawer Sheet */}
      <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 pb-8">
          <SheetHeader className="pb-3 border-b border-border/40">
            <SheetTitle className="flex items-center justify-between text-base font-bold">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span>{activeTab.name} Cart</span>
                {activeTab.isSaved && (
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    ● Held Active
                  </span>
                )}
              </div>
              <span className="text-primary text-lg font-mono font-extrabold">₦{grandTotal.toLocaleString()}</span>
            </SheetTitle>
          </SheetHeader>

          <div className="py-4 space-y-4">
            {/* Top Prominent Action Buttons in Sheet */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveCurrentOrder}
                disabled={cart.length === 0 || isSavingDraft}
                className={`h-11 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border shadow-sm transition-all ${
                  activeTab.isSaved
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "border-primary/50 text-foreground hover:bg-muted"
                }`}
              >
                {isSavingDraft ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <BookmarkCheck className={`w-4 h-4 ${activeTab.isSaved ? "text-emerald-500" : "text-primary"}`} />
                )}
                <span>{activeTab.isSaved ? "Order Held Active" : "Hold / Save Order"}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleClearCurrentCart}
                disabled={cart.length === 0}
                className="h-11 rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/50 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear Cart</span>
              </Button>
            </div>

            {/* Order Type Toggle: Walk-in vs Room Charge */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40">
              <button
                onClick={() => updateActiveTab({ orderType: "WALKIN" })}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  orderType === "WALKIN" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Walk-in Guest
              </button>
              <button
                onClick={() => updateActiveTab({ orderType: "ROOM" })}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  orderType === "ROOM" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Room Bill
              </button>
            </div>

            {orderType === "WALKIN" ? (
              <Input
                placeholder="Customer Name / Table Number (Optional)"
                value={customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            ) : (
              <select
                value={selectedRoomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-border/70 text-xs"
              >
                <option value="">-- Choose Occupied Room --</option>
                {occupiedRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.number}
                  </option>
                ))}
              </select>
            )}

            {/* Mobile Cart Items List with large touch buttons */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {cart.map((c) => {
                const isFood = c.catalogType === "RESTAURANT"
                const itemUnitPrice = c.customPrice ?? c.item.price

                return (
                  <div key={`${c.catalogType}-${c.item.id}`} className="p-2.5 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between text-xs gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                          isFood ? "bg-amber-500/15 text-amber-600" : "bg-purple-500/15 text-purple-600"
                        }`}>
                          {isFood ? "Food" : "Drink"}
                        </span>
                        <span className="font-bold truncate text-foreground">{c.item.name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        @ ₦{itemUnitPrice.toLocaleString()} = <strong className="text-primary font-mono">₦{(itemUnitPrice * c.quantity).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(c.item.id, c.catalogType, -1)}
                        className="w-8 h-8 rounded-xl bg-background border border-border/70 active:bg-muted flex items-center justify-center text-foreground font-bold shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black text-xs w-6 text-center">{c.quantity}</span>
                      <button
                        onClick={() => updateQuantity(c.item.id, c.catalogType, 1)}
                        className="w-8 h-8 rounded-xl bg-background border border-border/70 active:bg-muted flex items-center justify-center text-foreground font-bold shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {cart.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Cart is empty. Tap any meal or drink to add.
                </div>
              )}
            </div>

            {/* Error in Drawer */}
            {error && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            {/* Checkout & Complete Order Button */}
            <div className="pt-2 space-y-2">
              <Button
                onClick={handleCheckout}
                disabled={isPending || cart.length === 0}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Order (₦{grandTotal.toLocaleString()})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── 4. INSTANT RECEIPT MODAL ──────────────────────────────────────── */}
      <ThermalReceiptModal
        isOpen={success}
        onClose={() => setSuccess(false)}
        data={receiptData}
      />
    </div>
  )
}
