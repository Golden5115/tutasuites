"use client"

import { useState, useTransition } from "react"
import { createLaundryRequest } from "@/app/actions/laundry-actions"
import { Plus, Trash2, Loader2, Save } from "lucide-react"
import { useRouter } from "next/navigation"

export function NewRequestClient({ catalog }: { catalog: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  
  const [customerName, setCustomerName] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  
  const [selectedItems, setSelectedItems] = useState<{ id: string, catalogItemId: string, quantity: number }[]>([])

  const addItem = () => {
    setSelectedItems([...selectedItems, { id: crypto.randomUUID(), catalogItemId: "", quantity: 1 }])
  }

  const updateItem = (id: string, field: string, value: string | number) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id))
  }

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const catalogItem = catalog.find(c => c.id === item.catalogItemId)
      if (catalogItem) {
        return total + (catalogItem.price * item.quantity)
      }
      return total
    }, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!customerName) {
      setError("Customer name is required.")
      return
    }

    if (selectedItems.length === 0 || selectedItems.some(i => !i.catalogItemId)) {
      setError("Please add at least one valid item.")
      return
    }

    startTransition(async () => {
      const result = await createLaundryRequest({
        customerName,
        roomNumber: roomNumber || undefined,
        items: selectedItems.map(i => ({ catalogItemId: i.catalogItemId, quantity: i.quantity }))
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push("/dashboard/laundry")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl shadow-sm p-6 md:p-8">
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-500 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Customer Name *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Room Number (Optional)
          </label>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-xl">Laundry Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {selectedItems.length === 0 ? (
          <div className="text-center py-8 bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 rounded-xl text-muted-foreground text-sm">
            No items added yet. Click "Add Item" to select from catalog.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedItems.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-xl border border-black/5 dark:border-white/5">
                <div className="w-full sm:flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Item</label>
                  <select
                    value={item.catalogItemId}
                    onChange={(e) => updateItem(item.id, 'catalogItemId', e.target.value)}
                    required
                    className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="" className="dark:bg-[#111] text-black dark:text-white">Select item...</option>
                    {catalog.map(c => (
                      <option key={c.id} value={c.id} className="dark:bg-[#111] text-black dark:text-white">{c.name} - ₦{c.price.toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full sm:w-24 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    required
                    className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-black/5 dark:border-white/5 gap-4">
        <div className="text-2xl font-heading">
          Total: <span className="text-primary">₦{calculateTotal().toLocaleString()}</span>
        </div>
        
        <button
          type="submit"
          disabled={isPending || selectedItems.length === 0}
          className="w-full sm:w-auto bg-primary text-primary-foreground font-bold uppercase tracking-[0.15em] text-sm rounded-xl px-8 py-3.5 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Request
        </button>
      </div>
    </form>
  )
}
