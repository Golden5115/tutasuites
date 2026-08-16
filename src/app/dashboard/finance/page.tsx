import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getComprehensiveFinanceData } from "@/app/actions/finance-actions"
import { FinanceDashboardClient } from "./finance-dashboard-client"

export default async function FinancePage() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const initialData = await getComprehensiveFinanceData("month")

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <FinanceDashboardClient initialData={initialData} />
    </div>
  )
}
