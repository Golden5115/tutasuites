import { getLaundryRequests } from "@/app/actions/laundry-actions"
import Link from "next/link"
import { Shirt, Plus, List, Search } from "lucide-react"
import { LaundryClient } from "./laundry-client"

export default async function LaundryPage() {
  const requests = await getLaundryRequests()

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading text-black dark:text-white flex items-center gap-3">
            <Shirt className="w-8 h-8 text-primary" />
            Laundry Operations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage guest laundry requests, dry cleaning, and billing.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link 
            href="/dashboard/laundry/new"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Request
          </Link>
        </div>
      </div>

      <LaundryClient requests={requests} />
    </div>
  )
}
