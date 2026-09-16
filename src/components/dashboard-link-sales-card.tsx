"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link2, Sparkles, Utensils, Wine, ArrowRight } from "lucide-react"
import { LinkSalesDialog } from "./link-sales-dialog"
import { getPotentialLinks } from "@/app/actions/combined-order-actions"

export function DashboardLinkSalesCard() {
  const [isOpen, setIsOpen] = useState(false)
  const [smartMatchesCount, setSmartMatchesCount] = useState(0)
  const [unlinkedCount, setUnlinkedCount] = useState(0)

  const checkLinks = () => {
    getPotentialLinks("today").then((res) => {
      setSmartMatchesCount(res.smartMatches?.length || 0)
      setUnlinkedCount((res.unlinkedRestaurantOrders?.length || 0) + (res.unlinkedBarOrders?.length || 0))
    })
  }

  useEffect(() => {
    checkLinks()
  }, [])

  return (
    <>
      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent border border-primary/25 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Combined Food & Bar Receipts</h3>
              {smartMatchesCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-black flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" />
                  {smartMatchesCount} match{smartMatchesCount > 1 ? "es" : ""} detected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                  Front Desk & POS
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {smartMatchesCount > 0
                ? `${smartMatchesCount} customer(s) ordered from both Kitchen and Bar today. Link them to generate 1 combined receipt!`
                : "Easily connect kitchen food sales and bar beverage orders for the same guest or room into one itemized receipt."}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-black font-bold text-xs rounded-xl shadow-md hover:opacity-90 gap-1.5 shrink-0 self-start sm:self-auto h-9"
        >
          <Link2 className="w-3.5 h-3.5" />
          Link Food & Bar Orders
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </div>

      <LinkSalesDialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
          checkLinks()
        }}
        onLinkSuccess={() => checkLinks()}
      />
    </>
  )
}
