"use client"

import { useState } from "react"
import { BedDouble, Wine, Utensils, Shirt, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

// --- 1. DEPARTMENT SALES BAR CHART ---
interface DepartmentSalesProps {
  sales: { name: string; revenue: number; color: string; icon: string }[]
  totalRevenue: number
}

export function DepartmentSalesBarChart({ sales, totalRevenue }: DepartmentSalesProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const maxRevenue = Math.max(...sales.map(s => s.revenue), 1)

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "BedDouble": return <BedDouble className="w-4 h-4" />
      case "Wine": return <Wine className="w-4 h-4" />
      case "Utensils": return <Utensils className="w-4 h-4" />
      case "Shirt": return <Shirt className="w-4 h-4" />
      default: return <DollarSign className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3.5">
        {sales.map((item, idx) => {
          const percent = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
          const barWidth = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
          const isHovered = hoveredIdx === idx

          return (
            <div
              key={item.name}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                isHovered
                  ? "bg-card shadow-md scale-[1.01] border-primary/40"
                  : "bg-muted/30 border-border/60 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                  >
                    {getIcon(item.icon)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{percent.toFixed(1)}% of total revenue</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">₦{item.revenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Bar track and fill */}
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden p-0.5 border border-border/40">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(barWidth, item.revenue > 0 ? 3 : 0)}%`,
                    backgroundColor: item.color,
                    boxShadow: isHovered ? `0 0 12px ${item.color}80` : undefined
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- 2. CASH FLOW COMPARISON BAR CHART (REVENUE VS EXPENSE) ---
interface TimeSeriesProps {
  data: { label: string; revenue: number; expense: number }[]
}

export function RevenueVsExpenseBarChart({ data }: TimeSeriesProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const maxVal = Math.max(
    ...data.map(d => Math.max(d.revenue, d.expense)),
    10000
  )

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-end gap-5 text-xs font-medium pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm" />
          <span className="text-muted-foreground">Revenue (Income)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-rose-500 shadow-sm" />
          <span className="text-muted-foreground">Expenses</span>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
        {data.map((item, idx) => {
          const revHeight = maxVal > 0 ? (item.revenue / maxVal) * 100 : 0
          const expHeight = maxVal > 0 ? (item.expense / maxVal) * 100 : 0
          const isHovered = hoveredIdx === idx

          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-16 z-20 bg-zinc-900 text-white text-[11px] p-2 rounded-xl shadow-xl border border-white/10 whitespace-nowrap pointer-events-none animate-in fade-in duration-150">
                  <div className="font-bold text-center border-b border-white/10 pb-1 mb-1">{item.label}</div>
                  <div className="flex justify-between gap-3 text-emerald-400">
                    <span>Income:</span>
                    <span className="font-bold">₦{item.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-rose-400">
                    <span>Expense:</span>
                    <span className="font-bold">₦{item.expense.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Bars container */}
              <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full max-h-52">
                {/* Revenue Bar */}
                <div
                  className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 ease-out group-hover:brightness-110"
                  style={{
                    height: `${Math.max(revHeight, item.revenue > 0 ? 4 : 2)}%`,
                    boxShadow: isHovered ? "0 0 10px rgba(16, 185, 129, 0.5)" : undefined
                  }}
                />

                {/* Expense Bar */}
                <div
                  className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-rose-600 to-rose-400 transition-all duration-500 ease-out group-hover:brightness-110"
                  style={{
                    height: `${Math.max(expHeight, item.expense > 0 ? 4 : 2)}%`,
                    boxShadow: isHovered ? "0 0 10px rgba(244, 63, 94, 0.5)" : undefined
                  }}
                />
              </div>

              {/* X Axis Label */}
              <span className="text-[10px] text-muted-foreground mt-2 font-medium truncate max-w-full text-center">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- 3. INTERACTIVE DONUT / PIE CHART ---
interface DonutSlice {
  label?: string
  name?: string
  amount?: number
  value?: number
  percentage: number
  color: string
}

interface DonutChartProps {
  slices: DonutSlice[]
  totalValue: number
  title: string
  centerSubtext?: string
}

export function InteractiveDonutChart({
  slices,
  totalValue,
  title,
  centerSubtext = "Total"
}: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (slices.length === 0 || totalValue === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs italic">
        <p>No data recorded for this period.</p>
      </div>
    )
  }

  // Calculate SVG arc paths for donut chart
  const radius = 64
  const strokeWidth = 24
  const circumference = 2 * Math.PI * radius

  let cumulativePercent = 0

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
      {/* SVG Donut */}
      <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />

          {/* Slices */}
          {slices.map((slice, idx) => {
            const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`
            const strokeDashoffset = -((cumulativePercent / 100) * circumference)
            cumulativePercent += slice.percentage
            const isHovered = hoveredIdx === idx

            return (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  filter: isHovered ? `drop-shadow(0 0 6px ${slice.color}80)` : undefined
                }}
              />
            )
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none px-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            {hoveredIdx !== null ? (slices[hoveredIdx].name || slices[hoveredIdx].label) : centerSubtext}
          </span>
          <span className="text-sm font-bold text-foreground mt-0.5">
            ₦{(hoveredIdx !== null ? (slices[hoveredIdx].amount || slices[hoveredIdx].value || 0) : totalValue).toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold text-primary">
            {hoveredIdx !== null ? `${slices[hoveredIdx].percentage.toFixed(1)}%` : `${slices.length} items`}
          </span>
        </div>
      </div>

      {/* Legend / Breakdown List */}
      <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
        {slices.map((slice, idx) => {
          const isHovered = hoveredIdx === idx
          const displayName = slice.name || slice.label || "Other"
          const displayVal = slice.amount || slice.value || 0

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                isHovered
                  ? "bg-card shadow-sm border-primary/40 scale-[1.01]"
                  : "bg-muted/20 border-transparent hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-xs font-semibold text-foreground truncate">{displayName}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs font-bold text-foreground">₦{displayVal.toLocaleString()}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {slice.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
