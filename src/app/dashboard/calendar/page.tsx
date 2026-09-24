import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { start?: string }
}) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Calculate Date Range (30 days)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const startDate = searchParams.start ? new Date(searchParams.start) : new Date(today)
  startDate.setDate(startDate.getDate() - 2) // Start 2 days ago for context
  
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 30)

  // Generate Array of Dates for the Header
  const daysArray: Date[] = []
  for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
    daysArray.push(new Date(d))
  }

  // Fetch Rooms & Reservations
  const rooms = await prisma.room.findMany({
    include: { roomType: true },
    orderBy: [{ roomType: { name: 'asc' } }, { number: 'asc' }]
  })

  const reservations = await prisma.reservation.findMany({
    where: {
      checkOut: { gte: startDate },
      checkIn: { lte: endDate },
      status: { notIn: ["CANCELLED"] }
    },
    include: { guest: true }
  })

  // Navigation Dates
  const prevDate = new Date(startDate)
  prevDate.setDate(prevDate.getDate() - 14) // jump back 2 weeks
  
  const nextDate = new Date(startDate)
  nextDate.setDate(nextDate.getDate() + 14) // jump forward 2 weeks

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-wide flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-primary" />
            Booking Calendar
          </h1>
          <p className="text-muted-foreground mt-1">Visual timeline of all hotel reservations.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/calendar?start=${prevDate.toISOString().split('T')[0]}`} className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Link href="/dashboard/calendar" className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition">
            Today
          </Link>
          <Link href={`/dashboard/calendar?start=${nextDate.toISOString().split('T')[0]}`} className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition">
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-x-auto flex-1">
        <div className="min-w-[1200px]">
          {/* Header Row */}
          <div className="flex border-b border-black/[0.04] dark:border-white/[0.06] sticky top-0 bg-background/95 backdrop-blur z-20">
            <div className="w-48 shrink-0 border-r border-black/[0.04] dark:border-white/[0.06] p-4 font-bold text-sm bg-black/[0.02] dark:bg-white/[0.02]">
              Room
            </div>
            <div className="flex-1 grid grid-cols-30">
              {daysArray.map((day, i) => {
                const isToday = day.getTime() === today.getTime()
                return (
                  <div key={i} className={`p-2 text-center border-r border-black/[0.02] dark:border-white/[0.02] flex flex-col justify-center items-center ${isToday ? 'bg-primary/10' : ''}`} style={{ width: 'minmax(0, 1fr)' }}>
                    <span className={`text-[10px] font-medium uppercase ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {day.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Grid Rows */}
          <div className="relative">
            {rooms.map((room) => {
              // Find reservations for this specific room
              const roomReservations = reservations.filter(r => r.roomId === room.id)

              return (
                <div key={room.id} className="flex border-b border-black/[0.04] dark:border-white/[0.06] hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors h-16">
                  {/* Room Label (Sticky Left) */}
                  <div className="w-48 shrink-0 border-r border-black/[0.04] dark:border-white/[0.06] p-3 flex flex-col justify-center bg-background z-10 sticky left-0">
                    <span className="font-bold text-sm text-foreground">Room {room.number}</span>
                    <span className="text-[10px] text-muted-foreground font-medium truncate">{room.roomType.name}</span>
                  </div>

                  {/* Grid Cells & Blocks Container */}
                  <div className="flex-1 relative">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex">
                      {daysArray.map((_, i) => (
                        <div key={i} className="flex-1 border-r border-black/[0.02] dark:border-white/[0.02]" />
                      ))}
                    </div>

                    {/* Reservation Blocks */}
                    {roomReservations.map(res => {
                      // Calculate start and end offsets
                      const resStart = new Date(res.checkIn)
                      resStart.setHours(0, 0, 0, 0)
                      const resEnd = new Date(res.checkOut)
                      resEnd.setHours(0, 0, 0, 0)

                      // If reservation starts before our timeline, clamp it
                      const displayStart = resStart < startDate ? startDate : resStart
                      // If reservation ends after our timeline, clamp it
                      const displayEnd = resEnd > endDate ? endDate : resEnd

                      // Calculate positioning percentages based on 30 days
                      const totalDays = 30
                      const dayMs = 1000 * 60 * 60 * 24

                      const startDiffDays = Math.max(0, (displayStart.getTime() - startDate.getTime()) / dayMs)
                      const durationDays = Math.max(0.5, (displayEnd.getTime() - displayStart.getTime()) / dayMs) // Min 0.5 days width

                      const leftPercent = (startDiffDays / totalDays) * 100
                      const widthPercent = (durationDays / totalDays) * 100

                      // Determine color based on status
                      let bgColor = "bg-primary text-primary-foreground"
                      if (res.status === "CHECKED_IN") bgColor = "bg-emerald-500 text-white"
                      if (res.status === "CHECKED_OUT") bgColor = "bg-slate-400 text-white"

                      return (
                        <Link 
                          href={`/dashboard/reservations`} 
                          key={res.id}
                          className={`absolute top-2 bottom-2 rounded-lg p-2 shadow-sm truncate text-xs font-medium hover:brightness-110 transition cursor-pointer flex flex-col justify-center z-10 ${bgColor}`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            minWidth: '40px'
                          }}
                          title={`${res.guest.firstName} ${res.guest.lastName} - ${res.status}`}
                        >
                          <span className="truncate">{res.guest.firstName} {res.guest.lastName}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
