"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

export function PublicNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      <nav className="absolute top-0 w-full z-50 flex items-center justify-between px-6 md:px-16 py-6 mix-blend-difference">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex flex-col items-center">
            <div className="relative w-20 h-8 md:w-24 md:h-10">
              <Image 
                src="/logo.png" 
                alt="Tuta Suites Logo" 
                fill 
                className="object-contain invert"
                priority
              />
            </div>
            <span className="text-[8px] md:text-[10px] font-bold tracking-[0.3em] text-white mt-1">TUTASUITES</span>
          </Link>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-12 text-sm tracking-[0.15em] uppercase font-medium text-white">
          <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
          <Link href="/rooms" className="hover:text-white/70 transition-colors">Rooms</Link>
          <a href="/#about" className="hover:text-white/70 transition-colors">About</a>
          <a href="/#contact" className="hover:text-white/70 transition-colors">Contact</a>
          <Link href="/booking" className="hover:text-white/70 transition-colors">My Booking</Link>
        </div>
        
        <div className="hidden lg:block">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
          >
            Staff Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden text-white p-2"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-6 lg:hidden animate-in fade-in duration-300">
          <div className="flex justify-end">
            <button 
              className="text-white p-2"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1 gap-10 text-white text-xl tracking-[0.2em] uppercase font-light">
            <Link href="/" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors">Home</Link>
            <Link href="/rooms" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors">Rooms</Link>
            <a href="/#about" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors">About</a>
            <a href="/#contact" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors">Contact</a>
            <Link href="/booking" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors">My Booking</Link>
            
            <Link 
              href="/login" 
              onClick={() => setIsOpen(false)}
              className="mt-8 px-8 py-4 bg-[#D4AF37] text-black text-sm font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#F3E5AB] transition-all"
            >
              Staff Login
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
