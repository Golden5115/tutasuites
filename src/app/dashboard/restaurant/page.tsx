import { getRestaurantCatalog, getRestaurantOrders, getRestaurantAnalytics } from "@/app/actions/restaurant-actions"
import { getOccupiedRooms } from "@/app/actions"
import { RestaurantViewContainer } from "./restaurant-view-container"

export default async function RestaurantPOSPage() {
  const [catalog, occupiedRooms, initialOrders, initialAnalytics] = await Promise.all([
    getRestaurantCatalog(),
    getOccupiedRooms(),
    getRestaurantOrders({ dateFilter: "today" }),
    getRestaurantAnalytics("today")
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <RestaurantViewContainer
        catalog={catalog}
        occupiedRooms={occupiedRooms}
        initialOrders={initialOrders}
        initialAnalytics={initialAnalytics}
      />
    </div>
  )
}
