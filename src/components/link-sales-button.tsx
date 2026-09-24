"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Sparkles } from "lucide-react"
import { LinkSalesDialog } from "./link-sales-dialog"

interface LinkSalesButtonProps {
  initialRestaurantOrderId?: string
  initialBarOrderId?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  label?: string
  showBadge?: boolean
  smartMatchCount?: number
  onSuccess?: () => void
}

export function LinkSalesButton({
  initialRestaurantOrderId,
  initialBarOrderId,
  variant = "outline",
  size = "sm",
  className = "",
  label = "Link Food & Bar Sales",
  showBadge = false,
  smartMatchCount = 0,
  onSuccess
}: LinkSalesButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Link2 className="w-3.5 h-3.5 mr-1.5" />
        <span>{label}</span>
        {showBadge && smartMatchCount > 0 && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-primary text-black flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            {smartMatchCount}
          </span>
        )}
      </Button>

      <LinkSalesDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialRestaurantOrderId={initialRestaurantOrderId}
        initialBarOrderId={initialBarOrderId}
        onLinkSuccess={() => {
          if (onSuccess) onSuccess()
        }}
      />
    </>
  )
}
