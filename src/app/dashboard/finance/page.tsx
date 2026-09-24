import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getComprehensiveFinanceData } from "@/app/actions/finance-actions"
import { FinanceDashboardClient } from "./finance-dashboard-client"

export default async function FinancePage() {
  const session = await auth()
  const user = session?.user as any
  const isAdmin = user?.role === "ADMIN"
  const hasFinanceModule = user?.modules?.includes("FINANCE")

  if (!session || (!isAdmin && !hasFinanceModule)) {
    if (user?.modules?.includes("EXPENSES")) {
      redirect("/dashboard/expenses")
    }
    redirect("/dashboard")
  }

  const initialData = await getComprehensiveFinanceData("month")

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <FinanceDashboardClient initialData={initialData} />
    </div>
  )
}
