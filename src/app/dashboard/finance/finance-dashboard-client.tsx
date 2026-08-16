"use client"

import { useState, useTransition } from "react"
import { getComprehensiveFinanceData } from "@/app/actions/finance-actions"
import {
  DepartmentSalesBarChart,
  RevenueVsExpenseBarChart,
  InteractiveDonutChart,
} from "./finance-charts"
import { ExpenseForm } from "./expense-form"
import { ExpenseList } from "./expense-list"
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  BedDouble,
  Wine,
  Utensils,
  Shirt,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Percent,
  Wallet,
  Sparkles,
  Loader2,
  Receipt,
  Layers,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface FinanceDashboardProps {
  initialData: any
}

export function FinanceDashboardClient({ initialData }: FinanceDashboardProps) {
  const [data, setData] = useState(initialData)
  const [period, setPeriod] = useState<"week" | "month" | "year" | "all">(initialData.period || "month")
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (newPeriod: "week" | "month" | "year" | "all") => {
    setPeriod(newPeriod)
    startTransition(async () => {
      const refreshed = await getComprehensiveFinanceData(newPeriod)
      setData(refreshed)
    })
  }

  const periodLabels: Record<string, string> = {
    week: "This Week (Last 7 Days)",
    month: "This Month",
    year: "This Year",
    all: "All Time Record",
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      {/* Top Header & Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" /> Financial Analytics & Expense Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track weekly & monthly expenses, compare department sales, and analyze profit margins.
          </p>
        </div>

        {/* Period Switcher */}
        <div className="inline-flex items-center p-1 bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 shadow-sm self-start md:self-auto">
          {[
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "year", label: "This Year" },
            { key: "all", label: "All Time" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => handlePeriodChange(p.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                period === p.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
          {isPending && <Loader2 className="w-4 h-4 animate-spin text-primary ml-2 mr-1" />}
        </div>
      </div>

      {/* KPI CARDS (Gross Revenue, Weekly/Monthly Expenses, Net Profit, Operating Expense Ratio) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. GROSS REVENUE */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gross Revenue</p>
              <p className="text-[10px] text-muted-foreground">{periodLabels[period]}</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">₦{data.totalPeriodRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Rooms:</span> ₦{data.roomRevenue.toLocaleString()}
            <span className="mx-1">•</span>
            <span className="font-semibold text-foreground">F&B + Laundry:</span> ₦{(data.barRevenue + data.restaurantRevenue + data.laundryRevenue).toLocaleString()}
          </div>
        </div>

        {/* 2. WEEKLY EXPENSES */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weekly Expenses</p>
              <p className="text-[10px] text-muted-foreground">Current 7 Days</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-rose-500">₦{data.totalWeeklyExpenses.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <span>Monthly Expenses:</span>
            <span className="font-bold text-foreground">₦{data.totalMonthlyExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* 3. NET PROFIT */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              data.netProfit >= 0 ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-600"
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Profit</p>
              <p className="text-[10px] text-muted-foreground">{periodLabels[period]}</p>
            </div>
          </div>
          <p className={`text-3xl font-bold ${data.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {data.netProfit < 0 ? "-" : ""}₦{Math.abs(data.netProfit).toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-[11px]">
            <span className="text-muted-foreground">Profit Margin:</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              data.netProfitMargin >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
            }`}>
              {data.netProfitMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 4. EXPENSE RATIO & OCCUPANCY */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expense Ratio</p>
              <p className="text-[10px] text-muted-foreground">OER % of Revenue</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{data.operatingExpenseRatio.toFixed(1)}%</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <span>Occupancy Rate:</span>
            <span className="font-bold text-foreground">{data.occupancyRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* DEPARTMENT REVENUE SUMMARY MINI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border bg-card/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase">
            <BedDouble className="w-4 h-4 text-blue-500" /> Rooms & Suites
          </div>
          <p className="text-lg font-bold text-foreground mt-2">₦{data.roomRevenue.toLocaleString()}</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase">
            <Wine className="w-4 h-4 text-amber-500" /> Mini Lounge Bar
          </div>
          <p className="text-lg font-bold text-foreground mt-2">₦{data.barRevenue.toLocaleString()}</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase">
            <Utensils className="w-4 h-4 text-emerald-500" /> Kitchen / Restaurant
          </div>
          <p className="text-lg font-bold text-foreground mt-2">₦{data.restaurantRevenue.toLocaleString()}</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase">
            <Shirt className="w-4 h-4 text-purple-500" /> Laundry Service
          </div>
          <p className="text-lg font-bold text-foreground mt-2">₦{data.laundryRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* CHARTS ROW 1: BAR CHARTS (Department Sales Comparison & Cash Flow Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BAR CHART 1: Department Sales Comparison */}
        <Card className="shadow-sm border-border/80">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Sales Comparison Across Departments</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Revenue generated by Rooms, Mini Lounge, Kitchen, and Laundry for {periodLabels[period].toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <DepartmentSalesBarChart
              sales={data.departmentSales}
              totalRevenue={data.totalPeriodRevenue}
            />
          </CardContent>
        </Card>

        {/* BAR CHART 2: Cash Flow Trend (Revenue vs Expenses) */}
        <Card className="shadow-sm border-border/80">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Cash Flow Trend (Income vs Expenses)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Time-series comparison of total daily/monthly revenue against expenses.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <RevenueVsExpenseBarChart data={data.timeSeriesTrend} />
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 2: PIE & DONUT CHARTS (Expense Category Breakdown & Revenue Share) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PIE / DONUT 1: Expense Breakdown by Category */}
        <Card className="shadow-sm border-border/80">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-rose-500" />
              <CardTitle className="text-base">Expense Category Breakdown (Pie Chart)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Distribution of expenses across Utilities, Diesel, Salaries, Maintenance, and Supplies.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <InteractiveDonutChart
              slices={data.expenseCategories}
              totalValue={data.totalPeriodExpenses}
              title="Expenses"
              centerSubtext="Total Exp"
            />
          </CardContent>
        </Card>

        {/* PIE / DONUT 2: Revenue Share Breakdown */}
        <Card className="shadow-sm border-border/80">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-base">Revenue Share by Department (Pie Chart)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Percentage contribution of each department to total hotel gross income.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <InteractiveDonutChart
              slices={data.revenueShare}
              totalValue={data.totalPeriodRevenue}
              title="Revenue"
              centerSubtext="Total Rev"
            />
          </CardContent>
        </Card>
      </div>

      {/* DETAILED CATEGORY BREAKDOWN TABLE */}
      {data.expenseCategories.length > 0 && (
        <Card className="shadow-sm border-border/80 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Detailed Expense Categories Breakdown</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Itemized analysis of all expenditures grouped by category with volume and percentages.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-xl border border-border/60 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-muted-foreground/70 uppercase tracking-widest bg-muted/40 border-b border-border/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Expense Category</th>
                    <th className="px-4 py-3 font-semibold">Entries Count</th>
                    <th className="px-4 py-3 font-semibold">Total Amount</th>
                    <th className="px-4 py-3 font-semibold text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.expenseCategories.map((cat: any) => (
                    <tr key={cat.category} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        {cat.label}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{cat.count} expense record(s)</td>
                      <td className="px-4 py-3 font-bold text-rose-500">₦{cat.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        <span className="px-2 py-0.5 rounded-md bg-muted text-foreground">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LOG EXPENSE & RECENT EXPENSES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LOG EXPENSE FORM */}
        <div className="lg:col-span-5">
          <Card className="shadow-sm border-border/80 sticky top-6">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base">Log New Hotel Expense</CardTitle>
              <CardDescription className="text-xs">
                Record diesel purchases, utility bills, salary payments, or repairs.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ExpenseForm
                onSuccess={() => {
                  handlePeriodChange(period)
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* RECENT EXPENSES LIST */}
        <div className="lg:col-span-7">
          <Card className="shadow-sm border-border/80">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-500" />
                Expense Ledger & Logs
              </CardTitle>
              <CardDescription className="text-xs">
                Review and manage individual expense entries recorded in {periodLabels[period].toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ExpenseList expenses={data.expenses} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
