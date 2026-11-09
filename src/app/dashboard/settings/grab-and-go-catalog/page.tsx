import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getGrabAndGoCatalog } from "@/app/actions/grab-and-go-actions"
import { GrabAndGoCatalogClient } from "./grab-and-go-catalog-client"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function GrabAndGoCatalogPage() {
  const session = await auth()
  const user = session?.user as any
  const isAdmin = user?.role === "ADMIN"
  const hasSettingsAccess = isAdmin || (user?.modules || []).includes("SETTINGS")

  if (!session || !hasSettingsAccess) {
    redirect("/dashboard")
  }

  const items = await getGrabAndGoCatalog()

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div className="animate-slide-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-emerald-500" />
          <span>Tuta Grab &amp; Go Catalog</span>
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Manage the official Tuta Grab &amp; Go menu, portion prices, and station categories. Restricted to Settings / Administrators.
        </p>
      </div>

      <GrabAndGoCatalogClient items={items} />
    </div>
  )
}

