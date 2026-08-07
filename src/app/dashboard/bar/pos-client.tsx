"use client"

import { useState, useTransition } from "react"
import { createBarOrder } from "@/app/actions/bar-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Minus, Plus, ShoppingCart, Trash2, Loader2, Wine, User, BedDouble } from "lucide-react"

import { ThermalReceiptModal, ReceiptData } from "@/components/thermal-receipt-modal"

export function POSClient({ catalog, occupiedRooms }: { catalog: any[], occupiedRooms: any[] }) {
  const [cart, setCart] = useState<{ item: any, quantity: number }[]>([])
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  
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
        <CardContent className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredCatalog.map(item => (
              <div 
                key={item.id}
                onClick={() => addToCart(item)}
                className="p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-bold text-sm text-primary">₦{item.price.toLocaleString()}</p>
                  <span className="text-[10px] text-muted-foreground">Stock: {item.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CART & CHECKOUT */}
      <Card className="lg:col-span-4 glass-panel flex flex-col h-[calc(100vh-12rem)]">
        <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4 shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="w-4 h-4 text-primary" /> Current Order
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground/60 text-sm">
              No items added to order yet.
            </div>
          ) : (
            cart.map(i => (
              <div key={i.item.id} className="flex items-center justify-between p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex-1 pr-2">
                  <p className="text-sm font-semibold truncate">{i.item.name}</p>
                  <p className="text-xs text-muted-foreground">₦{i.item.price.toLocaleString()} × {i.quantity}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => updateQuantity(i.item.id, -1)}
                    className="p-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{i.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(i.item.id, 1)}
                    className="p-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => updateQuantity(i.item.id, -i.quantity)}
                    className="p-1 rounded text-red-500 hover:bg-red-500/10 text-xs ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>

        <div className="p-4 border-t border-black/[0.04] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] space-y-4 shrink-0">
          <div className="flex items-center justify-between text-base font-bold">
            <span>Total:</span>
            <span className="text-primary text-lg">₦{totalAmount.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
            <button
              onClick={() => setOrderType("WALKIN")}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${orderType === "WALKIN" ? "bg-primary text-black font-bold shadow-sm" : "text-muted-foreground"}`}
            >
              Walk-in Customer
            </button>
            <button
              onClick={() => setOrderType("ROOM")}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${orderType === "ROOM" ? "bg-primary text-black font-bold shadow-sm" : "text-muted-foreground"}`}
            >
              Bill to Room
            </button>
          </div>

          {orderType === "WALKIN" ? (
            <Input 
              placeholder="Customer Name (Optional)" 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)}
              className="rounded-xl text-sm"
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

      {/* 80mm Thermal Receipt Modal */}
      <ThermalReceiptModal 
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  )
}
