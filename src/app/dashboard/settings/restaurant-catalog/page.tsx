import { getRestaurantCatalog } from "@/app/actions/restaurant-actions"
import { RestaurantCatalogClient } from "./restaurant-client"
import { ArrowLeft, Utensils } from "lucide-react"
import Link from "next/link"

export default async function RestaurantCatalogPage() {
  const items = await getRestaurantCatalog()

  return (
    <div className="space-y-6">
      <Link 
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div className="animate-slide-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold pb-1 flex items-center gap-3">
          <Utensils className="w-8 h-8 text-primary" /> Restaurant Catalog
        </h1>
        <p className="text-sm text-muted-foreground/60 font-medium mt-1">
          Manage food menu, prices, and categories.
        </p>
      </div>

      <RestaurantCatalogClient items={items} />
    </div>
  )
}
