"use client"

import { useState, useTransition } from "react"
import {
  GrabAndGoMenuItem,
  addGrabAndGoItem,
  updateGrabAndGoItem,
  deleteGrabAndGoItem,
  seedDefaultGrabAndGoCatalog,
} from "@/app/actions/grab-and-go-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Trash2,
  RotateCcw,
  Edit3,
  Loader2,
} from "lucide-react"

const GRAB_AND_GO_CATEGORIES = [
  "Rice",
  "Swallow",
  "Soups",
  "Protein",
  "Sides",
  "Extras",
  "Drinks",
] as const

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

export function GrabAndGoCatalogClient({ items }: { items: GrabAndGoMenuItem[] }) {
  const [isPending, startTransition] = useTransition()
  const [editingItem, setEditingItem] = useState<GrabAndGoMenuItem | null>(null)
  const [catalogMessage, setCatalogMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Add / Edit Item Form */}
      <Card className="lg:col-span-4 border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {editingItem ? (
              <>
                <Edit3 className="w-4 h-4 text-amber-500" />
                Edit Menu Item
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-emerald-500" />
                Add New Grab &amp; Go Item
              </>
            )}
          </CardTitle>
          <CardDescription>
            {editingItem
              ? `Updating "${editingItem.name}"`
              : "Add a new dish, protein, side, or drink to Tuta Grab & Go."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              setCatalogMessage(null)
              const res = editingItem
                ? await updateGrabAndGoItem(formData)
                : await addGrabAndGoItem(formData)
              if (res.error) {
                setCatalogMessage({ type: "error", text: res.error })
              } else {
                setCatalogMessage({
                  type: "success",
                  text: editingItem
                    ? "Item updated!"
                    : "New item added to Tuta Grab & Go!",
                })
                setEditingItem(null)
              }
            }}
            key={editingItem?.id || "new-item"}
            className="space-y-4"
          >
            {editingItem && (
              <input type="hidden" name="id" value={editingItem.id} />
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Item Name</Label>
              <Input
                name="name"
                required
                defaultValue={editingItem?.name || ""}
                placeholder="e.g. Jollof Rice, Shawarma, Zobo"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Station / Category</Label>
              <select
                name="category"
                defaultValue={editingItem?.category || "Rice"}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {GRAB_AND_GO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                Price per Portion (₦) — Set 0 if Free w/ Swallow
              </Label>
              <Input
                name="price"
                type="number"
                min="0"
                step="50"
                required
                defaultValue={editingItem ? editingItem.price : ""}
                placeholder="e.g. 500"
              />
            </div>

            <input
              type="hidden"
              name="stock"
              value={editingItem?.stock ?? 500}
            />
            <input type="hidden" name="isAvailable" value="true" />

            {catalogMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  catalogMessage.type === "success"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-red-500/15 text-red-500"
                }`}
              >
                {catalogMessage.text}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingItem ? (
                  "Save Changes"
                ) : (
                  "Add to Menu"
                )}
              </Button>
              {editingItem && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const res = await seedDefaultGrabAndGoCatalog()
                  if (res.success) {
                    setCatalogMessage({
                      type: "success",
                      text: "Official Tuta Grab & Go price list restored!",
                    })
                  } else if (res.error) {
                    setCatalogMessage({
                      type: "error",
                      text: res.error,
                    })
                  }
                })
              }}
              className="w-full text-xs gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Official Default Price List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Price List Table by Category */}
      <Card className="lg:col-span-8">
        <CardHeader>
          <CardTitle className="text-base">
            Official Tuta Grab &amp; Go Price List ({items.length} Items)
          </CardTitle>
          <CardDescription>
            Click &quot;Edit Price&quot; on any item to adjust portion pricing or category.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {GRAB_AND_GO_CATEGORIES.map((category) => {
            const catItems = items.filter((i) => i.category === category)
            if (catItems.length === 0) return null
            return (
              <div key={category} className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  {getCategoryIcon(category)}
                  {category} ({catItems.length})
                </h3>
                <div className="divide-y divide-border/60 border border-border/70 rounded-2xl overflow-hidden">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between gap-3 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.price === 0
                            ? "Free with Swallow (₦0)"
                            : `₦${item.price.toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(item)}
                          className="h-8 text-xs rounded-xl gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit Price
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              const res = await deleteGrabAndGoItem(item.id)
                              if (res.error) {
                                setCatalogMessage({
                                  type: "error",
                                  text: res.error,
                                })
                              }
                            })
                          }}
                          className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

