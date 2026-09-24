import { getBarCatalog } from "@/app/actions/bar-actions"
import { BarCatalogClient } from "./bar-client"
import { ArrowLeft, Wine } from "lucide-react"
import Link from "next/link"

export default async function BarCatalogPage() {
  const items = await getBarCatalog()

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
          <Wine className="w-8 h-8 text-primary" /> Bar & Lounge Catalog
        </h1>
        <p className="text-sm text-muted-foreground/60 font-medium mt-1">
          Manage drink inventory, prices, and categories.
        </p>
      </div>

      <BarCatalogClient items={items} />
    </div>
  )
}
