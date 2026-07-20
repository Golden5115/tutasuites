"use client"

import { useState, useTransition } from "react"
import { createBarOrder } from "@/app/actions/bar-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Minus, Plus, ShoppingCart, Trash2, Loader2, Wine, User, BedDouble } from "lucide-react"

export function POSClient({ catalog, occupiedRooms }: { catalog: any[], occupiedRooms: any[] }) {
  const [cart, setCart] = useState<{ item: any, quantity: number }[]>([])
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  // Checkout states
  const [orderType, setOrderType] = useState<"WALKIN" | "ROOM">("WALKIN")
  const [customerName, setCustomerName] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState("")

  const filteredCatalog = catalog.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id)
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { item, quantity: 1 }]
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

  const totalAmount = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0)

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
        <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Drinks Catalog</CardTitle>
            <Input 
              placeholder="Search drinks..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredCatalog.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              disabled={item.stock <= 0}
              className="flex flex-col text-left p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] hover:border-primary/20 hover:bg-primary/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">{item.category}</span>
              <span className="font-bold text-sm text-foreground line-clamp-2 leading-tight">{item.name}</span>
              <span className="text-primary font-bold mt-2">₦{item.price.toLocaleString()}</span>
              
              <div className="absolute top-2 right-2 flex items-center justify-center">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.stock > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                  {item.stock} left
                </span>
              </div>
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
              <Wine className="w-12 h-12 mb-2 opacity-20" />
              Cart is empty
            </div>
          ) : (
            cart.map(c => (
              <div key={c.item.id} className="flex items-center justify-between p-3 rounded-xl border border-black/[0.06] bg-white/50">
                <div className="flex-1">
                  <p className="font-bold text-sm">{c.item.name}</p>
                  <p className="text-xs text-primary font-bold">₦{(c.item.price * c.quantity).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(c.item.id, -1)}>
                    {c.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                  </Button>
                  <span className="w-4 text-center text-xs font-bold">{c.quantity}</span>
                  <Button variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(c.item.id, 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
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
