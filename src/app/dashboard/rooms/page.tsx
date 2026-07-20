import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Edit, ListTree, Trash2 } from "lucide-react"

export default async function AdminRoomsPage() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const roomTypes = await prisma.roomType.findMany({
    include: {
      _count: {
        select: { rooms: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-wide">Room Types</h1>
          <p className="text-muted-foreground mt-1">Manage room categories, prices, and amenities.</p>
        </div>
        <Link href="/dashboard/rooms/new">
          <Button className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            New Room Type
          </Button>
        </Link>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground/60 uppercase tracking-widest bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/[0.06]">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Base Price</th>
                <th className="px-6 py-4 font-semibold">Capacity</th>
                <th className="px-6 py-4 font-semibold">Physical Rooms</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {roomTypes.map((rt) => (
                <tr key={rt.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{rt.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[250px] mt-0.5">{rt.description}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">₦{rt.basePrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-muted-foreground">{rt.capacity} Guests</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {rt._count.rooms} Rooms
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/dashboard/rooms/${rt.id}/instances`}>
                      <Button variant="outline" size="sm" className="rounded-lg h-8">
                        <ListTree className="mr-2 h-3.5 w-3.5" />
                        Manage Rooms
                      </Button>
                    </Link>
                    <Link href={`/dashboard/rooms/${rt.id}/edit`}>
                      <Button variant="outline" size="sm" className="rounded-lg h-8">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              
              {roomTypes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No room types found. Create your first room type to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
