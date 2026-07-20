"use client"

import { useState } from "react"
import { addExpense } from "@/app/actions/finance-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export function ExpenseForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      amount: formData.get("amount"),
      category: formData.get("category"),
      description: formData.get("description"),
      date: formData.get("date"),
    }

    const result = await addExpense(data)
    if (result.error) {
      setError(result.error)
    } else {
      ;(e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₦)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" required className="rounded-xl" placeholder="e.g. 50000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select 
            id="category" 
            name="category" 
            required 
            className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="UTILITIES">Utilities (Power/Water)</option>
            <option value="SALARY">Staff Salary</option>
            <option value="MAINTENANCE">Maintenance & Repairs</option>
            <option value="SUPPLIES">Supplies (Cleaning/Food)</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" required className="rounded-xl" placeholder="e.g. Paid PHCN bill for July" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" required className="rounded-xl" defaultValue={new Date().toISOString().split('T')[0]} />
      </div>

      <Button type="submit" disabled={loading} className="w-full rounded-xl shadow-lg shadow-primary/20">
        <Plus className="mr-2 h-4 w-4" />
        {loading ? "Adding..." : "Log Expense"}
      </Button>
    </form>
  )
}
