import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CleanButton } from "./clean-button"
import { Sparkles, BedDouble, AlertCircle } from "lucide-react"

export default async function HousekeepingPage() {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const roomsToClean = await prisma.room.findMany({
    where: { status: "CLEANING" },
    include: {
      roomType: true,
      reservations: {
        where: { status: "CHECKED_OUT" },
        orderBy: { actualCheckOut: 'desc' },
        take: 1,
        include: { guest: true }
      }
    },
    orderBy: { updatedAt: 'asc' }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-wide">Housekeeping</h1>
          <p className="text-muted-foreground mt-1">Manage rooms requiring cleaning turnover.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 rounded-xl font-medium text-sm">
          <AlertCircle className="h-4 w-4" />
          {roomsToClean.length} {roomsToClean.length === 1 ? 'Room' : 'Rooms'} Pending
        </div>
      </div>

      {roomsToClean.length === 0 ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">All Caught Up!</h2>
          <p className="text-muted-foreground">There are currently no rooms that require cleaning.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomsToClean.map(room => {
            const lastReservation = room.reservations[0]
            return (
              <div key={room.id} className="glass-panel p-5 rounded-2xl flex flex-col h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform duration-500 group-hover:scale-110">
                  <Sparkles className="w-24 h-24" />
                </div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Room {room.number}</h3>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-primary/80 mt-1">{room.roomType.name}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <BedDouble className="h-5 w-5 text-amber-500" />
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-6 relative z-10">
                  <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Previous Guest</p>
                    {lastReservation ? (
                      <>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {lastReservation.guest.firstName} {lastReservation.guest.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Checked out: {lastReservation.actualCheckOut ? new Date(lastReservation.actualCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent guest data.</p>
                    )}
                  </div>
                </div>

                <div className="mt-auto relative z-10">
                  <CleanButton roomId={room.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
