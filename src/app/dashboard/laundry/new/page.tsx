import { getLaundryCatalog } from "@/app/actions/laundry-actions"
import Link from "next/link"
import { ArrowLeft, PlusCircle } from "lucide-react"
import { NewRequestClient } from "./new-request-client"

export default async function NewLaundryRequestPage() {
  const catalog = await getLaundryCatalog()

  return (
    <div className="p-6 md:p-8 max-w-[800px] mx-auto w-full animate-in fade-in duration-500">
      <Link 
        href="/dashboard/laundry"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Laundry
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-heading text-black dark:text-white flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-primary" />
          New Laundry Request
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Log a new dry cleaning or laundry request for a guest.
        </p>
      </div>

      <NewRequestClient catalog={catalog} />
    </div>
  )
}
