"use client"

import { useState } from "react"
import { deleteExpense } from "@/app/actions/finance-actions"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function ExpenseList({ expenses }: { expenses: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense record?")) return
    setLoadingId(id)
    await deleteExpense(id)
    setLoadingId(null)
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No expenses recorded yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-[10px] text-muted-foreground/60 uppercase tracking-widest bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/[0.06]">
          <tr>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(expense.date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 font-medium text-foreground">
                {expense.description}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary/50 text-secondary-foreground">
                  {expense.category}
                </span>
              </td>
              <td className="px-4 py-3 font-bold text-red-500">
                - ₦{expense.amount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(expense.id)}
                  disabled={loadingId === expense.id}
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
