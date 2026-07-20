"use client"

import { useState, useTransition } from "react"
import { createRestaurantOrder } from "@/app/actions/restaurant-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus, ShoppingCart, Trash2, Loader2, Utensils, User, BedDouble } from "lucide-react"

export function POSClient({ catalog, occupiedRooms }: { catalog: any[], occupiedRooms: any[] }) {
  const [cart, setCart] = useState<{ item: any, quantity: number, customPrice?: number }[]>([])
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  const [orderType, setOrderType] = useState<"WALKIN" | "ROOM">("WALKIN")
  const [customerName, setCustomerName] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState("")

  const categories = ["All", ...Array.from(new Set(catalog.map(c => c.category)))]

  const filteredCatalog = catalog.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase())
    const matchesCat = categoryFilter === "All" || item.category === categoryFilter
    return matchesSearch && matchesCat
  })

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id)
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { item, quantity: 1, customPrice: item.price === 0 ? 0 : undefined }]
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.item.id === itemId) {
        const newQ = Math.max(0, i.quantity + delta)
        return { ...i, quantity: newQ }
      }
      return i
    }).filter(i => i.quantity > 0))
  }

  const updateCustomPrice = (itemId: string, price: number) => {
    setCart(prev => prev.map(i => {
      if (i.item.id === itemId) {
        return { ...i, customPrice: price }
      }
      return i
    }))
  }

  const totalAmount = cart.reduce((sum, item) => sum + ((item.customPrice ?? item.item.price) * item.quantity), 0)

  const handleCheckout = () => {
    setError("")
    setSuccess(false)
    
    if (cart.length === 0) return
    if (orderType === "ROOM" && !selectedRoomId) {
      setError("Please select a room to bill this order to.")
      return
    }

    const hasMissingPrices = cart.some(c => c.item.price === 0 && (c.customPrice === undefined || c.customPrice <= 0))
    if (hasMissingPrices) {
      setError("Please enter a valid price for 'Price on Request' items.")
      return
    }
    
    startTransition(async () => {
      const res = await createRestaurantOrder({
        isWalkIn: orderType === "WALKIN",
        customerName: orderType === "WALKIN" ? customerName : undefined,
        reservationId: orderType === "ROOM" ? occupiedRooms.find(r => r.id === selectedRoomId)?.reservations[0]?.id : undefined,
        totalAmount,
        items: cart.map(c => ({
          itemId: c.item.id,
          quantity: c.quantity,
          unitPrice: c.customPrice ?? c.item.price,
          totalPrice: (c.customPrice ?? c.item.price) * c.quantity
        }))
      })

      if (res.error) {
        setError(res.error)
      } else {
        setCart([])
        setCustomerName("")
        setSelectedRoomId("")
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-slide-up-delay-2">
      {/* CATALOG */}
      <Card className="lg:col-span-8 glass-panel h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4 shrink-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Restaurant Menu</CardTitle>
            <Input 
              placeholder="Search food..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs rounded-xl"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredCatalog.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="flex flex-col text-left p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] hover:border-primary/20 hover:bg-primary/[0.03] transition-all group relative"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">{item.category}</span>
              <span className="font-bold text-sm text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">{item.name}</span>
              <span className="text-primary font-bold mt-2">
                {item.price === 0 ? "Price on Request" : `₦${item.price.toLocaleString()}`}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* CART */}
      <Card className="lg:col-span-4 glass-panel h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4 shrink-0">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> Current Order
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 italic">
              <Utensils className="w-12 h-12 mb-2 opacity-20" />
              Cart is empty
            </div>
          ) : (
            cart.map(c => (
              <div key={c.item.id} className="flex flex-col p-3 rounded-xl border border-black/[0.06] bg-white/50 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-sm leading-tight">{c.item.name}</p>
                    {c.item.price > 0 ? (
                      <p className="text-xs text-primary font-bold">₦{(c.item.price * c.quantity).toLocaleString()}</p>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">₦</span>
                        <Input 
                          type="number" 
                          placeholder="Enter price" 
                          className="h-6 w-24 text-xs px-2"
                          value={c.customPrice || ""}
                          onChange={e => updateCustomPrice(c.item.id, parseFloat(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(c.item.id, -1)}>
                      {c.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                    </Button>
                    <span className="w-4 text-center text-xs font-bold">{c.quantity}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(c.item.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>

        {/* CHECKOUT PANEL */}
        <div className="p-4 border-t border-black/[0.06] shrink-0 space-y-4 bg-muted/20">
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-muted-foreground">Total Due:</span>
            <span className="text-3xl font-bold text-foreground">₦{totalAmount.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setOrderType("WALKIN")}
              className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${orderType === "WALKIN" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <User className="w-3.5 h-3.5" /> Walk-in
            </button>
            <button
              onClick={() => setOrderType("ROOM")}
              className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${orderType === "ROOM" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <BedDouble className="w-3.5 h-3.5" /> Bill to Room
            </button>
          </div>

          {orderType === "WALKIN" ? (
            <Input 
              placeholder="Customer Name (Optional)" 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)}
              className="rounded-xl"
            />
          ) : (
            <select 
              className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedRoomId}
              onChange={e => setSelectedRoomId(e.target.value)}
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
            className="w-full rounded-xl gold-btn"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Complete Order"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
