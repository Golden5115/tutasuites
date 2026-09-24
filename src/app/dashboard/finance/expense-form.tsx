"use client"

import { useState } from "react"
import { addExpense } from "@/app/actions/finance-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"

interface ExpenseFormProps {
  onSuccess?: () => void
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const formData = new FormData(form)
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
      form.reset()
      if (onSuccess) onSuccess()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-500 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-medium">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Amount (₦)
          </Label>
          <Input 
            id="amount" 
            name="amount" 
            type="number" 
            step="0.01" 
            required 
            className="rounded-xl h-10 text-sm font-semibold" 
            placeholder="e.g. 50000" 
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Expense Category
          </Label>
          <select 
            id="category" 
            name="category" 
            required 
            defaultValue="UTILITIES"
            className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="UTILITIES">⚡ Utilities (Power / Water / Internet)</option>
            <option value="DIESEL_FUEL">⛽ Diesel & Generator Fuel</option>
            <option value="SALARY">👥 Staff Salaries & Wages</option>
            <option value="MAINTENANCE">🔧 Repairs & Maintenance</option>
            <option value="SUPPLIES">🧼 Hotel & Cleaning Supplies</option>
            <option value="INVENTORY_RESTOCK">🍷 Bar & Kitchen Food Restock</option>
            <option value="MARKETING">📢 Marketing & Advertisements</option>
            <option value="OTHER">📦 Other General Expenses</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Description / Vendor
        </Label>
        <Input 
          id="description" 
          name="description" 
          required 
          className="rounded-xl h-10 text-sm" 
          placeholder="e.g. Purchased 200L diesel for generator / Staff salary payment" 
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Expense Date
        </Label>
        <Input 
          id="date" 
          name="date" 
          type="date" 
          required 
          className="rounded-xl h-10 text-sm" 
          defaultValue={new Date().toISOString().split('T')[0]} 
        />
      </div>

      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full rounded-xl h-11 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Recording Expense...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Record Expense
          </>
        )}
      </Button>
    </form>
  )
}
