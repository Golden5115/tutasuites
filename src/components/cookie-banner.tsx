"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasConsented = localStorage.getItem("tuta_cookie_consent")
    if (!hasConsented) {
      // Small delay to allow the page to load first
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("tuta_cookie_consent", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white dark:bg-[#0f0f0f] border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close cookie banner"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="bg-[#D4AF37]/20 p-2.5 rounded-xl shrink-0">
            <Cookie className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-lg mb-1">We value your privacy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            onClick={handleAccept}
            className="flex-1 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-bold py-2.5 px-4 rounded-xl text-sm transition-colors uppercase tracking-wider"
          >
            Accept All
          </button>
          <Link 
            href="/privacy" 
            onClick={() => setIsVisible(false)}
            className="flex-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors text-center"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  )
}
