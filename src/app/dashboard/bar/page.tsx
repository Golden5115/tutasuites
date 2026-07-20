import { getBarCatalog } from "@/app/actions/bar-actions"
import { getOccupiedRooms } from "@/app/actions"
import { POSClient } from "./pos-client"
import { Wine } from "lucide-react"

export default async function BarPOSPage() {
  const catalog = await getBarCatalog()
  const occupiedRooms = await getOccupiedRooms()

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold pb-1 flex items-center gap-3">
          <Wine className="w-8 h-8 text-primary" /> Mini Lounge POS
        </h1>
        <p className="text-sm text-muted-foreground/60 font-medium mt-1">
          Manage drink orders and bill them directly to rooms or process walk-ins.
        </p>
      </div>

      <POSClient catalog={catalog} occupiedRooms={occupiedRooms} />
    </div>
  )
}
