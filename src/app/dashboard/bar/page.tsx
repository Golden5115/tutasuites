import { getBarCatalog, getBarOrders, getBarAnalytics } from "@/app/actions/bar-actions"
import { getOccupiedRooms } from "@/app/actions"
import { BarViewContainer } from "./bar-view-container"

export default async function BarPOSPage() {
  const [catalog, occupiedRooms, initialOrders, initialAnalytics] = await Promise.all([
    getBarCatalog(),
    getOccupiedRooms(),
    getBarOrders({ dateFilter: "today" }),
    getBarAnalytics("today")
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <BarViewContainer
        catalog={catalog}
        occupiedRooms={occupiedRooms}
        initialOrders={initialOrders}
        initialAnalytics={initialAnalytics}
      />
    </div>
  )
}
