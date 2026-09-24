"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createRoomType, updateRoomType, deleteRoomType } from "@/app/actions/room-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"

export function RoomTypeForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this room type? This action cannot be undone.")) return
    setLoading(true)
    const result = await deleteRoomType(initialData.id)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push("/dashboard/rooms")
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      basePrice: formData.get("basePrice"),
      capacity: formData.get("capacity"),
      bedType: formData.get("bedType"),
      size: formData.get("size"),
      images: formData.get("images"),
      facilities: formData.get("facilities"),
      rules: formData.get("rules"),
      cancellation: formData.get("cancellation"),
    }

    let result
    if (initialData) {
      result = await updateRoomType(initialData.id, data)
    } else {
      result = await createRoomType(data)
    }

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push("/dashboard/rooms")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/rooms">
            <Button variant="ghost" size="icon" type="button" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-wide">
              {initialData ? "Edit Room Type" : "New Room Type"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {initialData ? "Modify existing room category details." : "Create a new category of rooms for guests to book."}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {initialData && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="rounded-xl">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button type="submit" disabled={loading} className="rounded-xl shadow-lg shadow-primary/20">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Room Type"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-bold border-b border-black/[0.04] dark:border-white/[0.06] pb-3">Basic Information</h2>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={initialData?.name} placeholder="e.g. Signature Suite" className="rounded-xl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" name="slug" required defaultValue={initialData?.slug} placeholder="e.g. signature-suite" className="rounded-xl" />
            <p className="text-xs text-muted-foreground">The URL path for this room type. Must be unique and lowercase without spaces.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required defaultValue={initialData?.description} rows={4} className="rounded-xl resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price (₦)</Label>
              <Input id="basePrice" name="basePrice" type="number" required defaultValue={initialData?.basePrice} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Guests)</Label>
              <Input id="capacity" name="capacity" type="number" required defaultValue={initialData?.capacity} className="rounded-xl" />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h2 className="text-lg font-bold border-b border-black/[0.04] dark:border-white/[0.06] pb-3">Room Features</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedType">Bed Type</Label>
                <Input id="bedType" name="bedType" required defaultValue={initialData?.bedType} placeholder="e.g. King Bed" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input id="size" name="size" required defaultValue={initialData?.size} placeholder="e.g. 65 sqm" className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilities">Facilities (Comma Separated)</Label>
              <Textarea id="facilities" name="facilities" required defaultValue={initialData?.facilities?.join(", ")} placeholder="Free WiFi, Air Conditioning, Smart TV..." rows={2} className="rounded-xl resize-none" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="images">Image URLs (Comma Separated)</Label>
              <Textarea id="images" name="images" required defaultValue={initialData?.images?.join(", ")} placeholder="/signature.png, https://..." rows={2} className="rounded-xl resize-none" />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h2 className="text-lg font-bold border-b border-black/[0.04] dark:border-white/[0.06] pb-3">Policies</h2>
            
            <div className="space-y-2">
              <Label htmlFor="rules">House Rules</Label>
              <Textarea id="rules" name="rules" required defaultValue={initialData?.rules} rows={2} className="rounded-xl resize-none" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation">Cancellation Policy</Label>
              <Textarea id="cancellation" name="cancellation" required defaultValue={initialData?.cancellation} rows={2} className="rounded-xl resize-none" />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
