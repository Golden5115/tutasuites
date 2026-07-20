import { getRestaurantCatalog } from "@/app/actions/restaurant-actions"
import { getOccupiedRooms } from "@/app/actions"
import { POSClient } from "./pos-client"
import { Utensils } from "lucide-react"

export default async function RestaurantPOSPage() {
  const catalog = await getRestaurantCatalog()
  const occupiedRooms = await getOccupiedRooms()

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold pb-1 flex items-center gap-3">
          <Utensils className="w-8 h-8 text-primary" /> Restaurant POS
        </h1>
        <p className="text-sm text-muted-foreground/60 font-medium mt-1">
          Manage food orders and bill them directly to rooms or process walk-ins.
        </p>
      </div>

      <POSClient catalog={catalog} occupiedRooms={occupiedRooms} />
    </div>
  )
}
