"use client"

import { useState } from "react"
import { UnifiedPOSClient } from "./pos-client"
import { AllPendingOrders } from "./all-pending-orders"
import { ShoppingCart, History, Utensils, Wine, Clock } from "lucide-react"
import { RestaurantSalesHistory } from "../restaurant/restaurant-sales-history"
import { PendingOrderEntry } from "@/app/actions/unified-pos-actions"

interface POSViewContainerProps {
  foodCatalog: any[]
  drinksCatalog: any[]
  occupiedRooms: any[]
  initialOrders: any[]
  initialAnalytics: any
  currentUserId: string
  currentUserName: string
  initialSavedTabs?: any[]
  isAdmin?: boolean
  initialPendingOrders?: PendingOrderEntry[]
}

export function POSViewContainer({
  foodCatalog,
  drinksCatalog,
  occupiedRooms,
  initialOrders,
  initialAnalytics,
  currentUserId,
  currentUserName,
  initialSavedTabs,
  isAdmin = false,
  initialPendingOrders = [],
}: POSViewContainerProps) {
  const [activeTab, setActiveTab] = useState<"pos" | "pending" | "history">("pos")
  const [importedTab, setImportedTab] = useState<any>(null)

  const pendingCount = initialPendingOrders.length

  const handleTakeOverOrder = (order: PendingOrderEntry) => {
    setImportedTab(order.rawTab)
    setActiveTab("pos")
  }

  return (
    <div className="space-y-6">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold pb-1 flex items-center gap-3">
            <span className="flex items-center gap-1 text-primary">
              <Utensils className="w-8 h-8" />
              <Wine className="w-7 h-7 -ml-2" />
            </span>
            <span>Restaurant &amp; Bar POS</span>
          </h1>
          <p className="text-sm text-muted-foreground/80 font-medium mt-1">
            Unified kitchen meals and bar drinks terminal. Single checkout, combined receipts, and instant direct printing.
          </p>
        </div>

        {/* Navigation Tabs (Smoothly scrollable on mobile) */}
        <div className="inline-flex p-1 bg-muted/80 backdrop-blur-md rounded-2xl border border-border/80 shadow-sm self-start sm:self-auto overflow-x-auto max-w-full custom-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeTab === "pos"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>POS Terminal</span>
          </button>

          {/* Admin-Only All Pending Orders Tab */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                activeTab === "pending"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>All Pending Orders</span>
              {pendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === "pending"
                      ? "bg-black text-primary"
                      : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Sales History</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "pos" && (
        <UnifiedPOSClient
          foodCatalog={foodCatalog}
          drinksCatalog={drinksCatalog}
          occupiedRooms={occupiedRooms}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          initialSavedTabs={initialSavedTabs}
          importOrderTab={importedTab}
          onImportComplete={() => setImportedTab(null)}
        />
      )}

      {activeTab === "pending" && isAdmin && (
        <AllPendingOrders
          initialPendingOrders={initialPendingOrders}
          onTakeOverOrder={handleTakeOverOrder}
        />
      )}

      {activeTab === "history" && (
        <RestaurantSalesHistory initialOrders={initialOrders} initialAnalytics={initialAnalytics} />
      )}
    </div>
  )
}

