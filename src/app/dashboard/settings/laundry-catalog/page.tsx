import { getLaundryCatalog } from "@/app/actions/laundry-actions"
import Link from "next/link"
import { ArrowLeft, List } from "lucide-react"
import { CatalogClient } from "./catalog-client"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LaundryCatalogPage() {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard/laundry")
  }

  const catalog = await getLaundryCatalog()

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto w-full animate-in fade-in duration-500">
      <Link 
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading text-black dark:text-white flex items-center gap-3">
            <List className="w-8 h-8 text-primary" />
            Price Catalog
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage the fixed price list for all dry cleaning items.
          </p>
        </div>
      </div>

      <CatalogClient initialCatalog={catalog} />
    </div>
  )
}
