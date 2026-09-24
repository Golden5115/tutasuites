"use client"

import { useState, useTransition } from "react"
import { addBarItem, updateBarItem, deleteBarItem } from "@/app/actions/bar-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Loader2, Save, X } from "lucide-react"

export function BarCatalogClient({ items }: { items: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState("")
  
  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const res = await addBarItem(new FormData(e.currentTarget))
      if (res.error) setError(res.error)
      else setIsAdding(false)
    })
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const res = await updateBarItem(new FormData(e.currentTarget))
      if (res.error) setError(res.error)
      else setEditingId(null)
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Delete this item?")) {
      startTransition(async () => {
        await deleteBarItem(id)
      })
    }
  }

  return (
    <div className="space-y-6 animate-slide-up-delay-1">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-heading">Inventory List</h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding} className="gold-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Drink
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <div className="grid gap-3">
        {isAdding && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <form onSubmit={handleAdd} className="grid sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3 space-y-1.5">
                  <Label>Name</Label>
                  <Input name="name" required placeholder="e.g. Jack Daniel's" className="bg-white dark:bg-black/20" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Category</Label>
                  <Input name="category" required placeholder="Whiskey" className="bg-white dark:bg-black/20" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Price (₦)</Label>
                  <Input name="price" type="number" required placeholder="5000" className="bg-white dark:bg-black/20" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Stock Qty</Label>
                  <Input name="stock" type="number" required defaultValue="10" className="bg-white dark:bg-black/20" />
                </div>
                <div className="sm:col-span-3 flex gap-2">
                  <Button type="submit" disabled={isPending} className="flex-1 gold-btn">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />} Save
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {items.map(item => (
          <Card key={item.id} className="glass-panel">
            <CardContent className="p-4">
              {editingId === item.id ? (
                <form onSubmit={handleUpdate} className="grid sm:grid-cols-12 gap-3 items-end">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label>Name</Label>
                    <Input name="name" defaultValue={item.name} required />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Category</Label>
                    <Input name="category" defaultValue={item.category} required />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Price (₦)</Label>
                    <Input name="price" type="number" defaultValue={item.price} required />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Stock Qty</Label>
                    <Input name="stock" type="number" defaultValue={item.stock} required />
                  </div>
                  <div className="sm:col-span-3 flex gap-2">
                    <Button type="submit" disabled={isPending} className="flex-1 gold-btn">
                      <Save className="w-4 h-4 mr-1.5" /> Save
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="grid sm:grid-cols-12 gap-4 w-full">
                    <div className="sm:col-span-3 font-bold">{item.name}</div>
                    <div className="sm:col-span-2 text-muted-foreground text-sm uppercase tracking-wider">{item.category}</div>
                    <div className="sm:col-span-2 font-bold text-primary">₦{item.price.toLocaleString()}</div>
                    <div className={`sm:col-span-2 font-bold ${item.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {item.stock} in stock
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="icon" onClick={() => setEditingId(item.id)} disabled={isPending}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)} disabled={isPending}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && !isAdding && (
          <div className="text-center py-10 text-muted-foreground/60">
            No drinks in the catalog. Add one above.
          </div>
        )}
      </div>
    </div>
  )
}
