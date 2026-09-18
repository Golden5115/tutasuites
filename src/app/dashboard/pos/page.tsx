import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUnifiedPOSData, getUserPOSDrafts, getAllPendingPOSOrders } from "@/app/actions/unified-pos-actions"
import { getRestaurantOrders, getRestaurantAnalytics } from "@/app/actions/restaurant-actions"
import { POSViewContainer } from "./pos-view-container"

export const dynamic = "force-dynamic"

export default async function UnifiedPOSPage() {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const user = session.user as any
  const currentUserId = user?.id || user?.email || "anonymous_pos_user"
  const currentUserName = user?.name || user?.email || "Staff"
  const isAdmin = user?.role === "ADMIN"

  const [posData, initialOrders, initialAnalytics, userDrafts, allPendingRes] = await Promise.all([
    getUnifiedPOSData(),
    getRestaurantOrders({ dateFilter: "today" }),
    getRestaurantAnalytics("today"),
    getUserPOSDrafts(),
    isAdmin ? getAllPendingPOSOrders() : Promise.resolve({ pendingOrders: [] }),
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <POSViewContainer
        foodCatalog={posData.foodCatalog}
        drinksCatalog={posData.drinksCatalog}
        occupiedRooms={posData.occupiedRooms}
        initialOrders={initialOrders}
        initialAnalytics={initialAnalytics}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        initialSavedTabs={userDrafts?.tabs || []}
        isAdmin={isAdmin}
        initialPendingOrders={allPendingRes?.pendingOrders || []}
      />
    </div>
  )
}

