import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ExpensesClient } from "./expenses-client"

export const metadata = {
  title: "Expense Management - Tuta Suites",
  description: "Record hotel operating expenses and track expenditure logs",
}

export default async function ExpensesPage() {
  const session = await auth()
  const user = session?.user as any
  const isAdmin = user?.role === "ADMIN"
  const canAccess = isAdmin || user?.modules?.includes("EXPENSES") || user?.modules?.includes("FINANCE")

  if (!canAccess) {
    redirect("/dashboard")
  }

  // Fetch recent hotel expenses (strictly without querying any company revenue, bookings, or sales figures)
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    take: 200,
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ExpensesClient initialExpenses={expenses} isAdmin={isAdmin} />
    </div>
  )
}
