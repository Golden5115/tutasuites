"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

export function PublicNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Detect scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out px-6 md:px-16 ${
          scrolled 
            ? "py-4 bg-black/80 backdrop-blur-lg border-b border-white/10 shadow-2xl shadow-black/50" 
            : "py-8 bg-transparent border-b border-transparent"
        }`}
      >
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex flex-col items-center group">
              <div className="relative w-20 h-8 md:w-24 md:h-10 transition-transform duration-500 group-hover:scale-105">
                <Image 
                  src="/logo.png" 
                  alt="Tuta Suites Logo" 
                  fill 
                  className="object-contain invert opacity-90 group-hover:opacity-100 transition-opacity"
                  priority
                />
              </div>
              <span className="text-[9px] md:text-[11px] font-bold tracking-[0.3em] text-white/90 group-hover:text-[#D4AF37] transition-colors mt-1">
                TUTASUITES
              </span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-12 text-xs tracking-[0.2em] uppercase font-medium text-white/80">
            {["Home", "Rooms", "About", "Contact"].map((item) => (
              <Link 
                key={item}
                href={item === "Home" ? "/" : item === "Rooms" ? "/rooms" : `/#${item.toLowerCase()}`} 
                className="relative group py-2 transition-colors hover:text-white"
              >
                {item}
                <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#D4AF37] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            
            <Link 
              href="/booking" 
              className="relative group py-2 transition-colors hover:text-white"
            >
              My Booking
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[#D4AF37] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>
          
          {/* Desktop Call to Actions */}
          <div className="hidden lg:flex items-center gap-6">
            <Link 
              href="/login" 
              className="text-xs font-medium uppercase tracking-[0.15em] text-white/60 hover:text-[#D4AF37] transition-colors"
            >
              Staff Login
            </Link>
            <Link 
              href="/rooms" 
              className="px-7 py-3.5 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-[#F3E5AB] transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="lg:hidden text-white/90 hover:text-[#D4AF37] transition-colors p-2"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="w-7 h-7" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col p-6 lg:hidden transition-all duration-500 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-4"
        }`}
      >
        <div className="flex justify-between items-center mb-12">
          <Link href="/" onClick={() => setIsOpen(false)} className="flex flex-col items-center">
            <div className="relative w-20 h-8">
              <Image src="/logo.png" alt="Tuta Suites Logo" fill className="object-contain invert" priority />
            </div>
          </Link>
          <button 
            className="text-white/70 hover:text-white transition-colors p-2"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-8 h-8" strokeWidth={1.5} />
          </button>
        </div>
        
        <div className="flex flex-col flex-1 gap-8 text-white text-lg tracking-[0.2em] uppercase font-light pl-4">
          <Link href="/" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors flex items-center gap-4">
            <span className="w-8 h-[1px] bg-white/20"></span> Home
          </Link>
          <Link href="/rooms" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors flex items-center gap-4">
            <span className="w-8 h-[1px] bg-white/20"></span> Rooms
          </Link>
          <a href="/#about" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors flex items-center gap-4">
            <span className="w-8 h-[1px] bg-white/20"></span> About
          </a>
          <a href="/#contact" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors flex items-center gap-4">
            <span className="w-8 h-[1px] bg-white/20"></span> Contact
          </a>
          <Link href="/booking" onClick={() => setIsOpen(false)} className="hover:text-[#D4AF37] transition-colors flex items-center gap-4">
            <span className="w-8 h-[1px] bg-white/20"></span> My Booking
          </Link>
        </div>

        <div className="mt-auto flex flex-col gap-4 pb-8">
          <Link 
            href="/rooms" 
            onClick={() => setIsOpen(false)}
            className="w-full py-5 bg-[#D4AF37] text-black text-sm font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-[#F3E5AB] transition-all text-center"
          >
            Book Now
          </Link>
          <Link 
            href="/login" 
            onClick={() => setIsOpen(false)}
            className="w-full py-5 bg-transparent border border-white/20 text-white text-sm font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-white/5 transition-all text-center"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </>
  )
}
