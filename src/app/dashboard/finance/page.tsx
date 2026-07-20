import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ExpenseForm } from "./expense-form"
import { ExpenseList } from "./expense-list"
import { Banknote, TrendingUp, TrendingDown, CalendarCheck, BedDouble } from "lucide-react"

export default async function FinancePage() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // 1. Calculate Revenue (Sum of totalAmount for reservations that are checked in, checked out, or confirmed)
  const validReservations = await prisma.reservation.findMany({
    where: {
      status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] }
    },
    include: {
      guest: true,
      room: { include: { roomType: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  const totalRevenue = validReservations.reduce((acc, curr) => acc + curr.totalAmount, 0)
  const totalBookings = validReservations.length

  // 2. Calculate Expenses
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' }
  })
  
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0)

  // 3. Net Profit
  const netProfit = totalRevenue - totalExpenses

  // 4. Occupancy metric (Rooms occupied vs total)
  const totalRoomsCount = await prisma.room.count()
  const occupiedRoomsCount = await prisma.room.count({ where: { status: "OCCUPIED" } })
  const occupancyRate = totalRoomsCount > 0 ? (occupiedRoomsCount / totalRoomsCount) * 100 : 0

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-wide">Finance & Analytics</h1>
        <p className="text-muted-foreground mt-1">Track revenue, monitor expenses, and analyze hotel performance.</p>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* REVENUE */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <TrendingUp className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Gross Revenue</p>
          </div>
          <p className="text-3xl font-bold text-foreground">₦{totalRevenue.toLocaleString()}</p>
        </div>

        {/* EXPENSES */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <TrendingDown className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</p>
          </div>
          <p className="text-3xl font-bold text-foreground">₦{totalExpenses.toLocaleString()}</p>
        </div>

        {/* NET PROFIT */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <Banknote className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Profit</p>
          </div>
          <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {netProfit < 0 ? '-' : ''}₦{Math.abs(netProfit).toLocaleString()}
          </p>
        </div>

        {/* METRICS */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <BedDouble className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Bookings</p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-foreground">{totalBookings}</p>
            <p className="text-xs font-medium text-muted-foreground mb-1">{occupancyRate.toFixed(1)}% Occupancy</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* EXPENSE TRACKER */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold border-b border-black/[0.04] dark:border-white/[0.06] pb-3 mb-4">Log New Expense</h2>
            <ExpenseForm />
          </div>
          
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold border-b border-black/[0.04] dark:border-white/[0.06] pb-3 mb-4">Recent Expenses</h2>
            <ExpenseList expenses={expenses} />
          </div>
        </div>

        {/* RECENT INCOME */}
        <div className="glass-panel p-6 rounded-2xl h-fit">
          <h2 className="text-lg font-bold border-b border-black/[0.04] dark:border-white/[0.06] pb-3 mb-4">Recent Income (Reservations)</h2>
          <div className="overflow-x-auto">
            {validReservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No reservations recorded yet.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-muted-foreground/60 uppercase tracking-widest bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/[0.06]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Guest</th>
                    <th className="px-4 py-3 font-semibold">Room</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {validReservations.slice(0, 10).map((res) => (
                    <tr key={res.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{res.guest.firstName} {res.guest.lastName}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(res.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{res.room.number}</div>
                        <div className="text-[10px] text-muted-foreground">{res.room.roomType.name}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-500">
                        + ₦{res.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {validReservations.length > 10 && (
              <div className="text-center pt-4 mt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-xs text-muted-foreground">
                Showing latest 10 reservations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
