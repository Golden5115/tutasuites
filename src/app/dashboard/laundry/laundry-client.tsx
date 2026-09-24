"use client"

import { useState, useTransition } from "react"
import { updateLaundryStatus, markLaundryAsPaid } from "@/app/actions/laundry-actions"
import { Check, Clock, Package, MoreVertical, FileText, Loader2, DollarSign } from "lucide-react"
import Link from "next/link"

export function LaundryClient({ requests }: { requests: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [activeRequest, setActiveRequest] = useState<string | null>(null)

  const handleStatusChange = (id: string, status: string) => {
    setActiveRequest(id)
    startTransition(async () => {
      await updateLaundryStatus(id, status)
      setActiveRequest(null)
    })
  }

  const handleMarkPaid = (id: string) => {
    setActiveRequest(id)
    startTransition(async () => {
      await markLaundryAsPaid(id)
      setActiveRequest(null)
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "WASHING": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "READY": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "DELIVERED": return "bg-green-500/10 text-green-500 border-green-500/20"
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-black/10 dark:border-white/10 rounded-3xl bg-black/5 dark:bg-white/5">
        <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-heading mb-2">No Laundry Requests</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          There are currently no active laundry requests in the system.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {requests.map((request) => (
        <div key={request.id} className="bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg">{request.customerName}</h3>
              <p className="text-sm text-muted-foreground">
                {request.roomNumber ? `Room ${request.roomNumber}` : "Walk-in Guest"}
              </p>
            </div>
            <div className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full border ${getStatusColor(request.status)}`}>
              {request.status}
            </div>
          </div>

          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 mb-6 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
              <span>Items</span>
              <span className="text-foreground">₦{request.totalAmount.toLocaleString()}</span>
            </h4>
            <ul className="space-y-2">
              {request.items.map((item: any) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.catalogItem.name}</span>
                  <span className="text-muted-foreground">₦{item.totalPrice.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5 dark:border-white/5">
            <div className="flex gap-2">
              {request.paymentStatus === "UNPAID" ? (
                <button
                  onClick={() => handleMarkPaid(request.id)}
                  disabled={isPending && activeRequest === request.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold uppercase rounded-lg hover:bg-green-500/20 transition-colors"
                >
                  {isPending && activeRequest === request.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />}
                  Mark Paid
                </button>
              ) : (
                <Link
                  href={`/dashboard/laundry/${request.id}/invoice`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  Invoice
                </Link>
              )}
            </div>

            <div className="flex gap-2">
              {request.status === "PENDING" && (
                <button onClick={() => handleStatusChange(request.id, "WASHING")} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-bold uppercase rounded-lg hover:bg-secondary/80">
                  Wash
                </button>
              )}
              {request.status === "WASHING" && (
                <button onClick={() => handleStatusChange(request.id, "READY")} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-bold uppercase rounded-lg hover:bg-secondary/80">
                  Ready
                </button>
              )}
              {request.status === "READY" && (
                <button onClick={() => handleStatusChange(request.id, "DELIVERED")} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold uppercase rounded-lg hover:bg-primary/90">
                  Deliver
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
