import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
  getGrabAndGoCatalog,
  getGrabAndGoOrders,
  getGrabAndGoAnalytics,
} from "@/app/actions/grab-and-go-actions"
import { GrabAndGoClient } from "./grab-and-go-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Tuta Grab & Go — Express Counter POS",
  description: "Dedicated fast-casual counter terminal, meal pack builder, and sales tracker for Tuta Grab and Go.",
}

export default async function GrabAndGoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const user = session.user as any
  const isAdmin = user?.role === "ADMIN"
  const userModules: string[] = user?.modules || []

  if (!isAdmin && !userModules.includes("GRAB_AND_GO") && !userModules.includes("RESTAURANT") && !userModules.includes("POS")) {
    redirect("/dashboard")
  }

  const resolvedParams = await searchParams
  const initialTab = resolvedParams?.tab === "history" ? "history" : "counter"

  const [catalog, initialOrders, initialAnalytics] = await Promise.all([
    getGrabAndGoCatalog(),
    getGrabAndGoOrders({ dateFilter: "today" }),
    getGrabAndGoAnalytics("today"),
  ])

  const currentUserId = user?.id || user?.email || "grab_and_go_cashier"
  const currentUserName = user?.name || user?.email || "Counter Cashier"

  return (
    <div className="animate-in fade-in duration-500">
      <GrabAndGoClient
        initialCatalog={catalog}
        initialOrders={initialOrders}
        initialAnalytics={initialAnalytics}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        isAdmin={isAdmin}
        initialActiveView={initialTab}
      />
    </div>
  )
}

