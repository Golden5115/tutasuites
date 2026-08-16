"use client"

import { useState } from "react"
import { deleteExpense } from "@/app/actions/finance-actions"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const categoryBadgeStyles: Record<string, { label: string; style: string }> = {
  UTILITIES: { label: "Utilities", style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  DIESEL_FUEL: { label: "Diesel / Fuel", style: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  SALARY: { label: "Salaries", style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  MAINTENANCE: { label: "Maintenance", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  SUPPLIES: { label: "Supplies", style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  INVENTORY_RESTOCK: { label: "Restock", style: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
  MARKETING: { label: "Marketing", style: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
  OTHER: { label: "General", style: "bg-muted text-muted-foreground border-border" },
}

export function ExpenseList({ expenses }: { expenses: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense record?")) return
    setLoadingId(id)
    await deleteExpense(id)
    setLoadingId(null)
  }

  const filtered = expenses.filter(e => {
    const term = search.toLowerCase()
    const descMatch = (e.description || "").toLowerCase().includes(term)
    const catMatch = (e.category || "").toLowerCase().includes(term)
    return descMatch || catMatch
  })

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs italic">
        No expenses recorded for this timeframe.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter expenses by description or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs rounded-xl bg-background"
        />
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-border/60">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] text-muted-foreground/70 uppercase tracking-widest bg-muted/40 border-b border-border/60 sticky top-0 backdrop-blur-md">
            <tr>
              <th className="px-3.5 py-2.5 font-semibold">Date</th>
              <th className="px-3.5 py-2.5 font-semibold">Description</th>
              <th className="px-3.5 py-2.5 font-semibold">Category</th>
              <th className="px-3.5 py-2.5 font-semibold">Amount</th>
              <th className="px-3.5 py-2.5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map((expense) => {
              const rawCat = (expense.category || "OTHER").toUpperCase()
              const catInfo = categoryBadgeStyles[rawCat] || { label: rawCat, style: "bg-muted text-muted-foreground border-border" }

              return (
                <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3.5 py-2.5 text-muted-foreground whitespace-nowrap">
                    {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-3.5 py-2.5 font-medium text-foreground max-w-[200px] truncate">
                    {expense.description}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.style}`}>
                      {catInfo.label}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-rose-500 whitespace-nowrap">
                    - ₦{expense.amount.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(expense.id)}
                      disabled={loadingId === expense.id}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      {loadingId === expense.id ? (
                        <Loader2 className="h-3 w-3 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
