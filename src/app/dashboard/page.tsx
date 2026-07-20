import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getAvailableRooms, getOccupiedRooms, checkOutGuest, extendStay } from "@/app/actions"
import { LogIn, LogOut, BedDouble, User, CalendarPlus, Banknote, DoorOpen } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { CheckInForm } from "@/components/check-in-form"
import { ExtendStayForm } from "@/components/extend-stay-form"
import { CheckOutButton } from "@/components/check-out-button"
import { AddChargeForm } from "@/components/add-charge-form"

export default async function Dashboard() {
  const availableRooms = await getAvailableRooms()
  const occupiedRooms = await getOccupiedRooms()

  const totalRooms = 6
  const occupiedCount = occupiedRooms.length
  const availableCount = totalRooms - occupiedCount

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold pb-1">
          Front Desk
        </h1>
        <p className="text-sm text-muted-foreground/60 font-medium mt-1">
          Manage arrivals, departures, and room assignments.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 animate-slide-up-delay-1">
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <BedDouble className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalRooms}</p>
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Total Rooms</p>
            </div>
          </div>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DoorOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{availableCount}</p>
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Available</p>
            </div>
          </div>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{occupiedCount}</p>
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Occupied</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12 animate-slide-up-delay-2">
        {/* CHECK IN FORM */}
        <Card className="lg:col-span-7 glass-panel">
          <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                <LogIn className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-heading font-semibold tracking-wide">New Check-In</CardTitle>
                <CardDescription className="text-xs text-muted-foreground/60">Register a guest and assign rooms.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CheckInForm availableRooms={availableRooms} />
        </Card>

        {/* ACTIVE ROOMS / CHECKOUT */}
        <div className="lg:col-span-5">
          <Card className="glass-panel">
            <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BedDouble className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-heading font-semibold tracking-wide">Active Rooms</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/60">Manage stays and process departures.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {occupiedRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <BedDouble className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm text-muted-foreground/40 font-medium">All rooms are vacant</p>
                  <p className="text-xs text-muted-foreground/30 mt-1">Rooms will appear here when guests check in.</p>
                </div>
              ) : (
                occupiedRooms.map(room => {
                  const reservation = room.reservations[0]
                  if (!reservation) return null
                  
                  return (
                    <div key={room.id} className="occupied-card flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-foreground">Room {room.number}</h3>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/70 mt-0.5">{room.roomType?.name || 'Standard'}</p>
                        </div>
                        <div className="stat-badge">
                          <User className="h-3 w-3" />
                          {reservation.numberOfGuests}
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-xl border border-black/[0.03] dark:border-white/[0.04]">
                        <p className="text-sm flex items-center gap-2">
                          <span className="text-muted-foreground/50 text-xs font-medium w-14">Guest</span>
                          <span className="font-semibold text-foreground text-sm">{reservation.guest.firstName} {reservation.guest.lastName}</span>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <span className="text-muted-foreground/50 text-xs font-medium w-14">Phone</span>
                          <span className="text-foreground/70 text-sm">{reservation.guest.phone}</span>
                        </p>
                        {reservation.valuableAssets && (
                          <p className="text-sm flex items-center gap-2">
                            <span className="text-muted-foreground/50 text-xs font-medium w-14">Assets</span>
                            <span className="text-primary/80 text-sm font-medium">{reservation.valuableAssets}</span>
                          </p>
                        )}
                        <p className="text-sm flex items-center gap-2">
                          <span className="text-muted-foreground/50 text-xs font-medium w-14">Paid</span>
                          <span className="text-primary font-bold text-sm">₦{reservation.totalAmount.toLocaleString()}</span>
                        </p>
                        {reservation.extrasAmount > 0 && (
                          <p className="text-sm flex items-center gap-2">
                            <span className="text-muted-foreground/50 text-xs font-medium w-14">POS/Extras</span>
                            <span className="text-amber-500 font-bold text-sm">+₦{reservation.extrasAmount.toLocaleString()}</span>
                          </p>
                        )}
                        <p className="text-sm flex items-center gap-2">
                          <span className="text-muted-foreground/50 text-xs font-medium w-14">Due</span>
                          <span className="text-foreground text-xs font-medium">{new Date(reservation.checkOut).toLocaleString('en-NG', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </p>
                      </div>

                      {/* Actions: Extend Stay, Add Charge, Check Out */}
                      <div className="pt-1 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Room Actions</p>
                        <div className="grid grid-cols-2 gap-2">
                          <ExtendStayForm reservationId={reservation.id} basePrice={room.roomType?.basePrice || 0} />
                          <AddChargeForm reservationId={reservation.id} />
                        </div>
                        <CheckOutButton roomId={room.id} reservationId={reservation.id} />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
