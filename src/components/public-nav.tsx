import Image from "next/image"
import Link from "next/link"

export function PublicNav() {
  return (
    <nav className="absolute top-0 w-full z-50 flex items-center justify-between px-8 md:px-16 py-6 mix-blend-difference">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex flex-col items-center">
          <div className="relative w-24 h-10">
            <Image 
              src="/logo.png" 
              alt="Tuta Suites Logo" 
              fill 
              className="object-contain invert"
              priority
            />
          </div>
          <span className="text-[10px] font-bold tracking-[0.3em] text-white mt-1">TUTASUITES</span>
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-12 text-sm tracking-[0.15em] uppercase font-medium">
        <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
        <Link href="/rooms" className="hover:text-white/70 transition-colors">Rooms</Link>
        <a href="/#about" className="hover:text-white/70 transition-colors">About</a>
        <a href="/#contact" className="hover:text-white/70 transition-colors">Contact</a>
        <Link href="/booking" className="hover:text-white/70 transition-colors">My Booking</Link>
      </div>
      <Link 
        href="/login" 
        className="px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
      >
        Staff Login
      </Link>
    </nav>
  )
}
