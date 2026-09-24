"use client"

import { useState } from "react"
import { addPhysicalRoom, deletePhysicalRoom } from "@/app/actions/room-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, DoorOpen, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function InstancesClient({ roomType }: { roomType: any }) {
  const [newRoomNumber, setNewRoomNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newRoomNumber) return
    setLoading(true)
    setError("")
    
    const result = await addPhysicalRoom(roomType.id, newRoomNumber)
    if (result.error) {
      setError(result.error)
    } else {
      setNewRoomNumber("")
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this physical room?")) return
    const result = await deletePhysicalRoom(id, roomType.id)
    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/rooms">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-wide">
            Manage Rooms: {roomType.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Add or remove physical room numbers for this category.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ADD NEW ROOM */}
        <div className="glass-panel p-6 rounded-2xl h-fit">
          <h2 className="font-bold border-b border-black/[0.04] dark:border-white/[0.06] pb-3 mb-4">Add Room</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Room Number / Identifier</label>
              <Input 
                value={newRoomNumber} 
                onChange={(e) => setNewRoomNumber(e.target.value)} 
                placeholder="e.g. 101, 102A, Penthouse" 
                className="rounded-xl"
              />
            </div>
            <Button type="submit" disabled={loading || !newRoomNumber} className="w-full rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </form>
        </div>

        {/* LIST EXISTING ROOMS */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl">
          <h2 className="font-bold border-b border-black/[0.04] dark:border-white/[0.06] pb-3 mb-4">
            Physical Rooms ({roomType.rooms.length})
          </h2>
          
          {roomType.rooms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DoorOpen className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>No physical rooms added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {roomType.rooms.map((room: any) => (
                <div key={room.id} className="flex items-center justify-between p-4 rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DoorOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{room.number}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{room.status}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(room.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
