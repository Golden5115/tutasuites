import Image from "next/image"
import Link from "next/link"
import { Calendar, ChevronRight, Star } from "lucide-react"
import { HeroCarousel } from "@/components/hero-carousel"
import { SearchForm } from "@/components/search-form"
import { prisma } from "@/lib/prisma"

export default async function LandingPage() {
  const roomTypes = await prisma.roomType.findMany({
    orderBy: { basePrice: 'desc' },
  })

  return (
    <>
      {/* Hero Section */}
      <header className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <HeroCarousel />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mt-20">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
            ))}
          </div>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight mb-6 leading-[1.1]">
            Uncompromising <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF8D6] to-[#D4AF37]">
              Luxury & Elegance
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl font-light mb-12">
            Experience the pinnacle of hospitality in the heart of the city. Where every detail is curated for your absolute comfort.
          </p>
          
          {/* Search Availability Form */}
          <SearchForm />
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="py-32 px-6 md:px-16 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden group">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
            <Image 
              src="/signature.png" 
              alt="Luxury suite interior" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105" 
            />
          </div>
          
          <div>
            <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-6">Our Story</h2>
            <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-tight mb-8 leading-[1.1]">
              A legacy of unparalleled hospitality and timeless elegance.
            </h3>
            <p className="text-white/70 text-lg md:text-xl font-light leading-relaxed mb-10">
              Nestled in the heart of the metropolis, Tuta Suites was born from a vision to create a sanctuary where modern luxury meets classic sophistication. Every corner of our property is designed to provide an unforgettable experience, combining world-class service with an unwavering attention to detail. Welcome to your new home away from home.
            </p>
            
            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
              <div>
                <p className="text-4xl font-heading text-white mb-2">24/7</p>
                <p className="text-sm text-white/50 uppercase tracking-widest font-bold">Concierge Service</p>
              </div>
              <div>
                <p className="text-4xl font-heading text-white mb-2">5-Star</p>
                <p className="text-sm text-white/50 uppercase tracking-widest font-bold">Luxury Amenities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Suites Section */}
      <section id="suites" className="py-32 px-6 md:px-16 max-w-[1600px] mx-auto bg-black">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4">Accommodations</h2>
            <h3 className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-tight">Curated spaces for the perfect getaway.</h3>
          </div>
          <p className="text-white/60 max-w-md text-lg font-light">
            Each of our suites is meticulously designed to provide an oasis of calm, featuring premium amenities and stunning aesthetics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {roomTypes.map((suite) => (
            <div key={suite.id} className="group relative rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.05] flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <Image 
                  src={suite.images[0] || "/signature.png"} 
                  alt={suite.name} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute top-6 right-6 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <span className="text-[#D4AF37] font-bold tracking-wider">₦{suite.basePrice.toLocaleString()}</span>
                  <span className="text-white/60 text-xs ml-1">/ night</span>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h4 className="font-heading text-3xl mb-3">{suite.name}</h4>
                <p className="text-white/60 text-lg font-light mb-8 flex-1">{suite.description}</p>
                <div className="flex flex-wrap gap-3 mb-8">
                  {suite.facilities.slice(0, 4).map(feat => (
                    <span key={feat} className="px-3 py-1.5 rounded-full bg-white/5 text-white/80 text-xs tracking-wider uppercase font-medium border border-white/10">
                      {feat}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Link 
                    href={`/rooms/${suite.slug}`}
                    className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-white/10 text-center"
                  >
                    View Details
                  </Link>
                  <Link 
                    href={`/book/${suite.slug}`}
                    className="flex-1 py-4 rounded-xl bg-[#D4AF37] text-black hover:bg-[#F3E5AB] transition-all duration-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    Book Now
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
