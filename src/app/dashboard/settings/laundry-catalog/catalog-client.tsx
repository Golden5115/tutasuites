"use client"

import { useState, useTransition } from "react"
import { addCatalogItem, deleteCatalogItem } from "@/app/actions/laundry-actions"
import { Trash2, Plus, Loader2 } from "lucide-react"

export function CatalogClient({ initialCatalog }: { initialCatalog: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      await addCatalogItem(formData)
    })
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      await deleteCatalogItem(id)
      setDeletingId(null)
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 order-2 lg:order-1">
        <div className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/5 dark:bg-white/5 text-xs uppercase font-bold tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Price (₦)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {initialCatalog.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No items in catalog. Add some items to get started.
                  </td>
                </tr>
              ) : (
                initialCatalog.map((item) => (
                  <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">₦{item.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending && deletingId === item.id}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                      >
                        {isPending && deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="order-1 lg:order-2">
        <form action={handleSubmit} className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-sm sticky top-6">
          <h3 className="font-heading text-xl mb-4">Add New Item</h3>
          
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Item Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Suit, Shirt, Dress"
                required
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="price" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Price (₦)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 1500"
                required
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.15em] text-sm rounded-xl px-6 py-3.5 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isPending && !deletingId ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add Item
          </button>
        </form>
      </div>
    </div>
  )
}
