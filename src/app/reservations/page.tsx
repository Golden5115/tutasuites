import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { History, FileText, TrendingUp } from "lucide-react"

export default async function ReservationsPage() {
  const reservations = await prisma.reservation.findMany({
    include: {
      room: {
        include: { roomType: true }
      },
      guest: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const totalRevenue = reservations
    .filter(r => r.status === "CHECKED_OUT")
    .reduce((sum, r) => sum + r.totalAmount, 0)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold pb-1">
          Reservations
        </h1>
        <p className="text-sm text-muted-foreground/60 font-medium mt-1">
          Historical ledger of all bookings and transactions.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 animate-slide-up-delay-1">
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reservations.length}</p>
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Total Bookings</p>
            </div>
          </div>
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">₦{totalRevenue.toLocaleString()}</p>
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Revenue (Checked Out)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="glass-panel animate-slide-up-delay-2">
        <CardHeader className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <History className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-heading font-semibold tracking-wide">Ledger</CardTitle>
              <CardDescription className="text-xs text-muted-foreground/60">Complete record of all reservations.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.04] dark:border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Ref</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Guest</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Room</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Dates</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground/40 text-sm">
                      No reservations recorded yet.
                    </td>
                  </tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-primary/70 font-semibold">
                        {res.bookingReference || res.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground text-sm">{res.guest.firstName} {res.guest.lastName}</div>
                        <div className="text-[11px] text-muted-foreground/50 mt-0.5">
                          {res.guest.phone || res.guest.email || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground text-sm">Room {res.room.number}</div>
                        <div className="text-[11px] text-muted-foreground/50 mt-0.5">{res.room.roomType?.name}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary text-sm">
                        ₦{res.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[11px] text-foreground/60">
                          <span className="font-semibold text-muted-foreground/60">IN:</span> {new Date(res.checkIn).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                        <div className="text-[11px] text-foreground/60 mt-0.5">
                          <span className="font-semibold text-muted-foreground/60">DUE:</span> {new Date(res.checkOut).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                        {res.actualCheckOut && (
                          <div className="text-[11px] text-foreground/60 mt-0.5">
                            <span className="font-semibold text-muted-foreground/60">OUT:</span> {new Date(res.actualCheckOut).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          res.status === 'CHECKED_IN' 
                            ? 'bg-blue-500/8 text-blue-600 dark:text-blue-400 border border-blue-500/15' 
                            : res.status === 'CHECKED_OUT'
                            ? 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                            : 'bg-muted text-muted-foreground/60 border border-black/[0.04] dark:border-white/[0.06]'
                        }`}>
                          {res.status === 'CHECKED_IN' ? 'Active' : res.status === 'CHECKED_OUT' ? 'Completed' : res.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
