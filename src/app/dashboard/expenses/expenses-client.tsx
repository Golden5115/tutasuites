"use client"

import { useState, useTransition } from "react"
import { getExpensesOnlyData } from "@/app/actions/finance-actions"
import { ExpenseForm } from "@/app/dashboard/finance/expense-form"
import { ExpenseList } from "@/app/dashboard/finance/expense-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Fuel, Wrench, RefreshCw, Loader2, Sparkles } from "lucide-react"

interface ExpensesClientProps {
  initialExpenses: any[]
  isAdmin: boolean
}

export function ExpensesClient({ initialExpenses, isAdmin }: ExpensesClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [isPending, startTransition] = useTransition()

  const refreshExpenses = () => {
    startTransition(async () => {
      try {
        const res = await getExpensesOnlyData()
        if (res?.expenses) {
          setExpenses(res.expenses)
        }
      } catch (err) {
        console.error("Error refreshing expenses:", err)
      }
    })
  }

  // Calculate total expense sum for current records
  const totalLoggedAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
              Hotel Expense Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Record and track day-to-day hotel operating costs, generator diesel, maintenance, and supplies.
          </p>
        </div>

        <button
          onClick={refreshExpenses}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-primary" : ""}`} />
          {isPending ? "Refreshing..." : "Refresh Records"}
        </button>
      </div>

      {/* Quick Summary Cards (Expense Metrics Only - No Company Revenue/Profits) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Recorded</p>
            <p className="text-2xl font-bold font-heading text-rose-500 mt-1">
              ₦{totalLoggedAmount.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Cumulative from recent entries</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Entries Count</p>
            <p className="text-2xl font-bold font-heading text-foreground mt-1">
              {expenses.length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Recorded expense logs</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Common Types</p>
            <p className="text-xs font-semibold text-foreground mt-1">Diesel, Repairs, Restock</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Operational expenditure</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Fuel className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Form, Right = Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LOG EXPENSE FORM */}
        <div className="lg:col-span-5">
          <Card className="shadow-sm border-border/80 sticky top-6">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Log New Expense
              </CardTitle>
              <CardDescription className="text-xs">
                Record generator fuel, utility bills, market purchases, or maintenance items.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ExpenseForm onSuccess={refreshExpenses} />
            </CardContent>
          </Card>
        </div>

        {/* RECENT EXPENSES LIST */}
        <div className="lg:col-span-7">
          <Card className="shadow-sm border-border/80">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-500" />
                Expense Ledger & Logs
              </CardTitle>
              <CardDescription className="text-xs">
                Review and filter individual expenditure entries logged in the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ExpenseList expenses={expenses} isAdmin={isAdmin} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
