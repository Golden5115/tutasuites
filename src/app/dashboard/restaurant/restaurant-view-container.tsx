"use client"

import { useState } from "react"
import { POSClient } from "./pos-client"
import { RestaurantSalesHistory } from "./restaurant-sales-history"
import { ShoppingCart, History, Utensils } from "lucide-react"

interface RestaurantViewContainerProps {
  catalog: any[]
  occupiedRooms: any[]
  initialOrders: any[]
  initialAnalytics: any
}

export function RestaurantViewContainer({
  catalog,
  occupiedRooms,
  initialOrders,
  initialAnalytics,
}: RestaurantViewContainerProps) {
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos")

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold pb-1 flex items-center gap-3">
            <Utensils className="w-8 h-8 text-primary" /> Restaurant POS & Kitchen
          </h1>
          <p className="text-sm text-muted-foreground/80 font-medium mt-1">
            Food orders, room service, daily kitchen audit, best seller combos, and receipt reprinting.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="inline-flex p-1 bg-muted/80 backdrop-blur-md rounded-2xl border border-border/80 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "pos"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            POS Terminal
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-4 h-4" />
            Sales History & Combos
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "pos" ? (
        <POSClient catalog={catalog} occupiedRooms={occupiedRooms} />
      ) : (
        <RestaurantSalesHistory initialOrders={initialOrders} initialAnalytics={initialAnalytics} />
      )}
    </div>
  )
}
