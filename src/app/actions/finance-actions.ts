"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function addExpense(data: any) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    const amount = parseFloat(data.amount)
    if (isNaN(amount) || amount <= 0) {
      return { error: "Please enter a valid expense amount." }
    }

    const expense = await prisma.expense.create({
      data: {
        amount,
        category: data.category || "OTHER",
        description: data.description || "General expense",
        date: data.date ? new Date(data.date) : new Date(),
      },
    })
    revalidatePath("/dashboard/finance")
    return { success: true, expense }
  } catch (error: any) {
    console.error("Failed to add expense:", error)
    return { error: "Failed to add expense" }
  }
}

export async function deleteExpense(id: string) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.expense.delete({
      where: { id },
    })
    revalidatePath("/dashboard/finance")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete expense:", error)
    return { error: "Failed to delete expense" }
  }
}

export async function getComprehensiveFinanceData(period: "week" | "month" | "year" | "all" = "month") {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const now = new Date()

  // 1. Calculate Date Bounds
  // Current Week (last 7 days)
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  weekStart.setHours(0, 0, 0, 0)

  // Current Month (1st day of this month)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

  // Current Year (1st day of this year)
  const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)

  // Determine period filter boundary
  let periodStart: Date | undefined
  if (period === "week") periodStart = weekStart
  else if (period === "month") periodStart = monthStart
  else if (period === "year") periodStart = yearStart
  else periodStart = undefined

  // 2. Fetch all expenses and all revenue streams
  const [
    allExpenses,
    periodExpenses,
    weeklyExpensesList,
    monthlyExpensesList,
    validReservations,
    barOrders,
    restaurantOrders,
    laundryRequests,
    totalRoomsCount,
    occupiedRoomsCount,
  ] = await Promise.all([
    // All expenses
    prisma.expense.findMany({ orderBy: { date: 'desc' } }),
    // Period expenses
    prisma.expense.findMany({
      where: periodStart ? { date: { gte: periodStart } } : undefined,
      orderBy: { date: 'desc' }
    }),
    // Weekly expenses (last 7 days)
    prisma.expense.findMany({
      where: { date: { gte: weekStart } },
      orderBy: { date: 'desc' }
    }),
    // Monthly expenses (this month)
    prisma.expense.findMany({
      where: { date: { gte: monthStart } },
      orderBy: { date: 'desc' }
    }),
    // Room Reservations
    prisma.reservation.findMany({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        ...(periodStart ? { createdAt: { gte: periodStart } } : {})
      },
      include: {
        guest: true,
        room: { include: { roomType: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    // Bar Orders (Walk-in only for direct revenue to avoid double counting room charges)
    prisma.barOrder.findMany({
      where: {
        isWalkIn: true,
        ...(periodStart ? { createdAt: { gte: periodStart } } : {})
      },
      orderBy: { createdAt: 'desc' }
    }),
    // Restaurant Orders (Walk-in only)
    prisma.restaurantOrder.findMany({
      where: {
        isWalkIn: true,
        ...(periodStart ? { createdAt: { gte: periodStart } } : {})
      },
      orderBy: { createdAt: 'desc' }
    }),
    // Laundry Requests (Paid only)
    prisma.laundryRequest.findMany({
      where: {
        paymentStatus: "PAID",
        ...(periodStart ? { createdAt: { gte: periodStart } } : {})
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.room.count(),
    prisma.room.count({ where: { status: "OCCUPIED" } }),
  ])

  // 3. Compute Totals for KPIs
  const totalWeeklyExpenses = weeklyExpensesList.reduce((acc, curr) => acc + curr.amount, 0)
  const totalMonthlyExpenses = monthlyExpensesList.reduce((acc, curr) => acc + curr.amount, 0)
  const totalPeriodExpenses = periodExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  const totalAllTimeExpenses = allExpenses.reduce((acc, curr) => acc + curr.amount, 0)

  // Revenue Breakdown for chosen period
  const roomRevenue = validReservations.reduce((acc, curr) => acc + curr.totalAmount, 0)
  const barRevenue = barOrders.reduce((acc, curr) => acc + curr.totalAmount, 0)
  const restaurantRevenue = restaurantOrders.reduce((acc, curr) => acc + curr.totalAmount, 0)
  const laundryRevenue = laundryRequests.reduce((acc, curr) => acc + curr.totalAmount, 0)

  const totalPeriodRevenue = roomRevenue + barRevenue + restaurantRevenue + laundryRevenue
  const netProfit = totalPeriodRevenue - totalPeriodExpenses
  const netProfitMargin = totalPeriodRevenue > 0 ? (netProfit / totalPeriodRevenue) * 100 : 0
  const operatingExpenseRatio = totalPeriodRevenue > 0 ? (totalPeriodExpenses / totalPeriodRevenue) * 100 : 0
  const occupancyRate = totalRoomsCount > 0 ? (occupiedRoomsCount / totalRoomsCount) * 100 : 0

  // 4. Department Sales Comparison (for Bar Chart)
  const departmentSales = [
    { name: "Rooms & Suites", revenue: roomRevenue, color: "#3B82F6", icon: "BedDouble" },
    { name: "Mini Lounge Bar", revenue: barRevenue, color: "#F59E0B", icon: "Wine" },
    { name: "Kitchen & Restaurant", revenue: restaurantRevenue, color: "#10B981", icon: "Utensils" },
    { name: "Laundry Operations", revenue: laundryRevenue, color: "#8B5CF6", icon: "Shirt" },
  ]

  // 5. Revenue Share Breakdown (for Donut/Pie Chart)
  const revenueShare = departmentSales
    .filter(d => d.revenue > 0)
    .map(d => ({
      name: d.name,
      value: d.revenue,
      percentage: totalPeriodRevenue > 0 ? (d.revenue / totalPeriodRevenue) * 100 : 0,
      color: d.color
    }))

  // 6. Expense Category Breakdown (for Donut/Pie Chart)
  const categoryLabels: Record<string, { label: string; color: string }> = {
    UTILITIES: { label: "Utilities (Power/Water)", color: "#3B82F6" },
    SALARY: { label: "Staff Salaries", color: "#10B981" },
    MAINTENANCE: { label: "Repairs & Maintenance", color: "#F59E0B" },
    SUPPLIES: { label: "Hotel & Cleaning Supplies", color: "#8B5CF6" },
    DIESEL_FUEL: { label: "Diesel & Generator Fuel", color: "#EF4444" },
    INVENTORY_RESTOCK: { label: "Bar & Food Inventory", color: "#EC4899" },
    MARKETING: { label: "Marketing & Ads", color: "#06B6D4" },
    OTHER: { label: "Other General Expenses", color: "#6B7280" },
  }

  const categoryMap: Record<string, { category: string; label: string; amount: number; count: number; color: string }> = {}

  for (const exp of periodExpenses) {
    const rawCat = (exp.category || "OTHER").toUpperCase()
    const catInfo = categoryLabels[rawCat] || { label: rawCat, color: "#6B7280" }
    
    if (!categoryMap[rawCat]) {
      categoryMap[rawCat] = {
        category: rawCat,
        label: catInfo.label,
        amount: 0,
        count: 0,
        color: catInfo.color
      }
    }
    categoryMap[rawCat].amount += exp.amount
    categoryMap[rawCat].count += 1
  }

  const expenseCategories = Object.values(categoryMap)
    .map(c => ({
      ...c,
      percentage: totalPeriodExpenses > 0 ? (c.amount / totalPeriodExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)

  // 7. Time-series Cash Flow Trend (Last 7 days or Last 6 months comparison)
  const timeSeriesTrend = []
  if (period === "week" || period === "month") {
    // Daily comparison for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

      // Day expenses
      const dayExp = allExpenses
        .filter(e => new Date(e.date) >= dayStart && new Date(e.date) <= dayEnd)
        .reduce((sum, e) => sum + e.amount, 0)

      // Day revenue
      const dayRoom = validReservations
        .filter(r => new Date(r.createdAt) >= dayStart && new Date(r.createdAt) <= dayEnd)
        .reduce((sum, r) => sum + r.totalAmount, 0)

      const dayBar = barOrders
        .filter(b => new Date(b.createdAt) >= dayStart && new Date(b.createdAt) <= dayEnd)
        .reduce((sum, b) => sum + b.totalAmount, 0)

      const dayRest = restaurantOrders
        .filter(ro => new Date(ro.createdAt) >= dayStart && new Date(ro.createdAt) <= dayEnd)
        .reduce((sum, ro) => sum + ro.totalAmount, 0)

      const dayLaund = laundryRequests
        .filter(l => new Date(l.createdAt) >= dayStart && new Date(l.createdAt) <= dayEnd)
        .reduce((sum, l) => sum + l.totalAmount, 0)

      const dayRev = dayRoom + dayBar + dayRest + dayLaund

      timeSeriesTrend.push({
        label: dayStr,
        revenue: dayRev,
        expense: dayExp
      })
    }
  } else {
    // Monthly comparison for last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' })
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

      const mExp = allExpenses
        .filter(e => new Date(e.date) >= mStart && new Date(e.date) <= mEnd)
        .reduce((sum, e) => sum + e.amount, 0)

      const mRoom = validReservations
        .filter(r => new Date(r.createdAt) >= mStart && new Date(r.createdAt) <= mEnd)
        .reduce((sum, r) => sum + r.totalAmount, 0)

      const mBar = barOrders
        .filter(b => new Date(b.createdAt) >= mStart && new Date(b.createdAt) <= mEnd)
        .reduce((sum, b) => sum + b.totalAmount, 0)

      const mRest = restaurantOrders
        .filter(ro => new Date(ro.createdAt) >= mStart && new Date(ro.createdAt) <= mEnd)
        .reduce((sum, ro) => sum + ro.totalAmount, 0)

      const mLaund = laundryRequests
        .filter(l => new Date(l.createdAt) >= mStart && new Date(l.createdAt) <= mEnd)
        .reduce((sum, l) => sum + l.totalAmount, 0)

      const mRev = mRoom + mBar + mRest + mLaund

      timeSeriesTrend.push({
        label: monthLabel,
        revenue: mRev,
        expense: mExp
      })
    }
  }

  return {
    period,
    totalWeeklyExpenses,
    totalMonthlyExpenses,
    totalPeriodExpenses,
    totalAllTimeExpenses,
    totalPeriodRevenue,
    roomRevenue,
    barRevenue,
    restaurantRevenue,
    laundryRevenue,
    netProfit,
    netProfitMargin,
    operatingExpenseRatio,
    totalBookings: validReservations.length,
    occupancyRate,
    departmentSales,
    revenueShare,
    expenseCategories,
    timeSeriesTrend,
    expenses: periodExpenses,
    recentReservations: validReservations.slice(0, 8),
  }
}
