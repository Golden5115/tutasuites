import { getUnifiedPOSData } from "@/app/actions/unified-pos-actions"
import { getRestaurantOrders, getRestaurantAnalytics } from "@/app/actions/restaurant-actions"
import { POSViewContainer } from "./pos-view-container"

export const dynamic = "force-dynamic"

export default async function UnifiedPOSPage() {
  const [posData, initialOrders, initialAnalytics] = await Promise.all([
    getUnifiedPOSData(),
    getRestaurantOrders({ dateFilter: "today" }),
    getRestaurantAnalytics("today"),
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <POSViewContainer
        foodCatalog={posData.foodCatalog}
        drinksCatalog={posData.drinksCatalog}
        occupiedRooms={posData.occupiedRooms}
        initialOrders={initialOrders}
        initialAnalytics={initialAnalytics}
      />
    </div>
  )
}
