"use client"

import { useState, useTransition } from "react"
import { createBarOrder } from "@/app/actions/bar-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus, ShoppingCart, Trash2, Loader2, Wine, User, BedDouble, ChevronRight, X as XIcon } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { ThermalReceiptModal, ReceiptData } from "@/components/thermal-receipt-modal"

interface OrderTab {
  id: string
  name: string
  cart: { item: any, quantity: number }[]
  orderType: "WALKIN" | "ROOM"
  customerName: string
  selectedRoomId: string
}

export function POSClient({ catalog, occupiedRooms }: { catalog: any[], occupiedRooms: any[] }) {
  // Multi-tab state
  const [tabs, setTabs] = useState<OrderTab[]>([
    { id: "tab-1", name: "Order #1", cart: [], orderType: "WALKIN", customerName: "", selectedRoomId: "" }
  ])
  const [activeTabId, setActiveTabId] = useState<string>("tab-1")

  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)

  // Current active tab object
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]
  const cart = activeTab.cart
  const orderType = activeTab.orderType
  const customerName = activeTab.customerName
  const selectedRoomId = activeTab.selectedRoomId

  // Helper to update active tab
  const updateActiveTab = (updates: Partial<OrderTab>) => {
    setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, ...updates } : t))
  }

  // Multi-tab actions
  const createNewTab = () => {
    const newId = `tab-${Date.now()}`
    const newName = `Order #${tabs.length + 1}`
    const newTab: OrderTab = { id: newId, name: newName, cart: [], orderType: "WALKIN", customerName: "", selectedRoomId: "" }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newId)
  }

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabs.length === 1) {
      setTabs([{ id: "tab-1", name: "Order #1", cart: [], orderType: "WALKIN", customerName: "", selectedRoomId: "" }])
      setActiveTabId("tab-1")
      return
    }
    const remaining = tabs.filter(t => t.id !== tabId)
    setTabs(remaining)
    if (activeTabId === tabId) {
      setActiveTabId(remaining[remaining.length - 1].id)
    }
  }

  const filteredCatalog = catalog.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (item: any) => {
    const updatedCart = (() => {
      const existing = cart.find(i => i.item.id === item.id)
      if (existing) {
        return cart.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...cart, { item, quantity: 1 }]
    })()
    updateActiveTab({ cart: updatedCart })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    const updatedCart = cart.map(i => {
      if (i.item.id === itemId) {
        const newQ = Math.max(0, i.quantity + delta)
        return { ...i, quantity: newQ }
      }
      return i
    }).filter(i => i.quantity > 0)
    updateActiveTab({ cart: updatedCart })
  }

  const handleCustomerNameChange = (name: string) => {
    const tabIndex = tabs.findIndex(t => t.id === activeTab.id) + 1
    const newTabName = name.trim() ? name.trim() : `Order #${tabIndex}`
    updateActiveTab({ customerName: name, name: newTabName })
  }

  const handleRoomChange = (roomId: string) => {
    const roomObj = occupiedRooms.find(r => r.id === roomId)
    const tabIndex = tabs.findIndex(t => t.id === activeTab.id) + 1
    const newTabName = roomObj ? `Room ${roomObj.number}` : `Order #${tabIndex}`
    updateActiveTab({ selectedRoomId: roomId, name: newTabName })
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0)
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = () => {
    setError("")
    setSuccess(false)
    
    if (cart.length === 0) return
    if (orderType === "ROOM" && !selectedRoomId) {
      setError("Please select a room to bill this order to.")
      return
    }
    
    startTransition(async () => {
      const res = await createBarOrder({
        isWalkIn: orderType === "WALKIN",
        customerName: orderType === "WALKIN" ? customerName : undefined,
        reservationId: orderType === "ROOM" ? occupiedRooms.find(r => r.id === selectedRoomId)?.reservations[0]?.id : undefined,
        totalAmount,
        items: cart.map(c => ({
          itemId: c.item.id,
          quantity: c.quantity,
          unitPrice: c.item.price,
          totalPrice: c.item.price * c.quantity
        }))
      })

      if (res.error) {
        setError(res.error)
      } else {
        const roomObj = occupiedRooms.find(r => r.id === selectedRoomId)
        setReceiptData({
          title: "MINI LOUNGE BAR",
          orderNumber: res.orderId ? res.orderId.slice(-6).toUpperCase() : String(Date.now()).slice(-6),
          date: new Date().toLocaleString(),
          orderType: orderType === "WALKIN" ? "Walk-in" : "Room Charge",
          customerName: orderType === "WALKIN" ? (customerName || "Walk-in Guest") : roomObj?.reservations?.[0]?.guest?.firstName + " " + (roomObj?.reservations?.[0]?.guest?.lastName || ""),
          roomNumber: orderType === "ROOM" ? roomObj?.number : undefined,
          items: cart.map(c => ({
            name: c.item.name,
            quantity: c.quantity,
            unitPrice: c.item.price,
            totalPrice: c.item.price * c.quantity
          })),
          totalAmount,
          paymentStatus: orderType === "WALKIN" ? "PAID" : "CHARGED TO ROOM"
        })

        // On checkout success: close active tab or reset if single
        if (tabs.length > 1) {
          const remaining = tabs.filter(t => t.id !== activeTab.id)
          setTabs(remaining)
          setActiveTabId(remaining[remaining.length - 1].id)
        } else {
          updateActiveTab({ cart: [], customerName: "", selectedRoomId: "", name: "Order #1" })
        }

        setSuccess(true)
        setIsMobileCartOpen(false)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  const renderCartContent = () => (
    <>
      <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/60 text-sm">
            No items added to {activeTab.name} yet.
          </div>
        ) : (
          cart.map(i => (
            <div key={i.item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex-1 pr-2">
                <p className="text-sm font-semibold truncate">{i.item.name}</p>
                <p className="text-xs text-muted-foreground">₦{i.item.price.toLocaleString()} × {i.quantity}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => updateQuantity(i.item.id, -1)}
                  className="p-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold w-5 text-center">{i.quantity}</span>
                <button 
                  onClick={() => updateQuantity(i.item.id, 1)}
                  className="p-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => updateQuantity(i.item.id, -i.quantity)}
                  className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 text-xs ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-black/[0.04] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] space-y-3 shrink-0">
        <div className="flex items-center justify-between text-base font-bold">
          <span>Total:</span>
          <span className="text-primary text-xl font-black">₦{totalAmount.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
          <button
            onClick={() => updateActiveTab({ orderType: "WALKIN" })}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${orderType === "WALKIN" ? "bg-primary text-black font-bold shadow-sm" : "text-muted-foreground"}`}
          >
            Walk-in Customer
          </button>
          <button
            onClick={() => updateActiveTab({ orderType: "ROOM" })}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${orderType === "ROOM" ? "bg-primary text-black font-bold shadow-sm" : "text-muted-foreground"}`}
          >
            Bill to Room
          </button>
        </div>

        {orderType === "WALKIN" ? (
          <Input 
            placeholder="Customer Name (e.g. Alex, Table 3)" 
            value={customerName} 
            onChange={e => handleCustomerNameChange(e.target.value)}
            className="rounded-xl text-sm h-10"
          />
        ) : (
          <select 
            className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedRoomId}
            onChange={e => handleRoomChange(e.target.value)}
          >
            <option value="">Select a Room</option>
            {occupiedRooms.map(room => (
              <option key={room.id} value={room.id}>
                Room {room.number} - {room.reservations?.[0]?.guest?.firstName}
              </option>
            ))}
          </select>
        )}

        {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
        {success && <p className="text-emerald-500 text-xs font-medium text-center">Order completed successfully!</p>}

        <Button 
          onClick={handleCheckout} 
          disabled={cart.length === 0 || isPending}
          className="w-full rounded-xl gold-btn h-11 text-sm font-bold"
        >
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : `Complete ${activeTab.name}`}
        </Button>
      </div>
    </>
  )

  return (
    <div className="space-y-4 animate-slide-up-delay-2 pb-24 lg:pb-0">
      {/* MULTI-CUSTOMER ORDER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const tabItemCount = tab.cart.reduce((sum, i) => sum + i.quantity, 0)
          const isActive = tab.id === activeTab.id

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border select-none ${
                isActive
                  ? "bg-primary text-black border-primary shadow-md shadow-primary/20 scale-[1.02]"
                  : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
              }`}
            >
              <span className="truncate max-w-[130px]">{tab.name}</span>
              {tabItemCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? "bg-black text-primary" : "bg-primary text-black"
                }`}>
                  {tabItemCount}
                </span>
              )}
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className={`p-0.5 rounded-md hover:bg-black/20 dark:hover:bg-white/20 transition-colors ${
                  isActive ? "text-black" : "text-muted-foreground"
                }`}
                title="Close tab"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          )
        })}

        <button
          onClick={createNewTab}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> + New Order Tab
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* CATALOG */}
        <Card className="lg:col-span-8 glass-panel min-h-[500px] lg:h-[calc(100vh-14rem)] flex flex-col">
          <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-primary" /> Drinks Catalog
              </CardTitle>
              <Input 
                placeholder="Search drinks..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-xs rounded-xl"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredCatalog.map(item => {
                const cartItem = cart.find(i => i.item.id === item.id)
                const currentQty = cartItem?.quantity || 0

                return (
                  <div 
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      currentQty > 0 
                        ? "border-primary/60 bg-primary/10 shadow-md shadow-primary/5" 
                        : "border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-primary/10 hover:border-primary/30"
                    }`}
                  >
                    {currentQty > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1.5 rounded-full bg-primary text-black font-black text-xs flex items-center justify-center shadow-lg border-2 border-background animate-in zoom-in-50 duration-150">
                        {currentQty}
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <p className="font-bold text-sm text-primary">₦{item.price.toLocaleString()}</p>
                      <span className="text-[10px] text-muted-foreground">Stock: {item.stock}</span>
                    </div>

                    {currentQty > 0 && (
                      <div 
                        className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-primary/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-primary">{currentQty} in order</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-primary hover:text-black transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* DESKTOP CART & CHECKOUT */}
        <Card className="lg:col-span-4 glass-panel flex flex-col h-[calc(100vh-14rem)] hidden lg:flex">
          <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4 shrink-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="w-4 h-4 text-primary" /> {activeTab.name} ({totalItemsCount})
            </CardTitle>
          </CardHeader>

          {renderCartContent()}
        </Card>

        {/* MOBILE DESKTOP FALLBACK CARD */}
        <Card className="lg:hidden glass-panel flex flex-col">
          <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4 shrink-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="w-4 h-4 text-primary" /> {activeTab.name} ({totalItemsCount})
            </CardTitle>
          </CardHeader>

          {renderCartContent()}
        </Card>
      </div>

      {/* FLOATING MOBILE CART BAR */}
      {totalItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-5">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-primary text-black font-bold p-3.5 rounded-2xl shadow-2xl flex items-center justify-between active:scale-[0.98] transition-all border border-black/10"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-black text-primary flex items-center justify-center font-black text-xs">
                {totalItemsCount}
              </div>
              <span className="text-sm font-extrabold">{activeTab.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black">₦{totalAmount.toLocaleString()}</span>
              <span className="text-xs bg-black/10 px-2 py-1 rounded-lg flex items-center">
                Checkout <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* MOBILE CART SHEET */}
      <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0 flex flex-col bg-background border-t border-primary/20">
          <SheetHeader className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0 flex flex-row items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="w-4 h-4 text-primary" /> {activeTab.name} ({totalItemsCount})
            </SheetTitle>
          </SheetHeader>
          
          {renderCartContent()}
        </SheetContent>
      </Sheet>

      {/* 80mm Thermal Receipt Modal */}
      <ThermalReceiptModal 
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  )
}
