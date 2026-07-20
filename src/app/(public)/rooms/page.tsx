import Image from "next/image"
import Link from "next/link"
import { BedDouble, Users, Maximize, ChevronRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { searchAvailability } from "@/app/actions/booking-actions"

interface Props {
  searchParams: Promise<{
    checkIn?: string
    checkOut?: string
    adults?: string
    children?: string
  }>
}

export default async function RoomsPage({ searchParams }: Props) {
  const params = await searchParams
  const hasSearch = params.checkIn && params.checkOut

  let roomTypes

  if (hasSearch) {
    roomTypes = await searchAvailability(
      params.checkIn!,
      params.checkOut!,
      Number(params.adults || 2),
      Number(params.children || 0)
    )
  } else {
    const allTypes = await prisma.roomType.findMany({
      orderBy: { basePrice: "desc" },
      include: { rooms: true },
    })
    roomTypes = allTypes.map((rt) => ({
      ...rt,
      availableCount: rt.rooms.filter((r) => r.status !== "MAINTENANCE").length,
      rooms: undefined,
    }))
  }

  const checkInParam = params.checkIn ? `&checkIn=${params.checkIn}` : ""
  const checkOutParam = params.checkOut ? `&checkOut=${params.checkOut}` : ""
  const adultsParam = params.adults ? `&adults=${params.adults}` : ""
  const childrenParam = params.children ? `&children=${params.children}` : ""
  const bookingParams = `?${checkInParam}${checkOutParam}${adultsParam}${childrenParam}`.replace("?&", "?")

  return (
    <>
      {/* Hero Banner */}
      <section className="relative pt-40 pb-20 px-6 md:px-16">
        <div className="absolute inset-0 z-0">
          <Image src="/hero.png" alt="Rooms" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl tracking-tight mb-4">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF8D6] to-[#D4AF37]">Suites</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {hasSearch
              ? `Showing available rooms for ${new Date(params.checkIn!).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} — ${new Date(params.checkOut!).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`
              : "Explore our carefully curated collection of premium suites."}
          </p>
        </div>
      </section>

      {/* Room Grid */}
      <section className="px-6 md:px-16 pb-32 max-w-[1600px] mx-auto">
        {roomTypes.length === 0 ? (
          <div className="text-center py-32">
            <BedDouble className="w-16 h-16 text-white/10 mx-auto mb-6" />
            <h3 className="font-heading text-3xl mb-3">No rooms available</h3>
            <p className="text-white/50 mb-8">No rooms match your search criteria. Try different dates or fewer guests.</p>
            <Link href="/rooms" className="px-8 py-4 bg-[#D4AF37] text-black text-sm font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#F3E5AB] transition-all">
              View All Rooms
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 -mt-10">
            {roomTypes.map((rt) => (
              <div key={rt.id} className="group relative rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.05] flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <Image
                    src={rt.images?.[0] || "/signature.png"}
                    alt={rt.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-6 right-6 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <span className="text-[#D4AF37] font-bold tracking-wider">₦{rt.basePrice.toLocaleString()}</span>
                    <span className="text-white/60 text-xs ml-1">/ night</span>
                  </div>
                  {hasSearch && (
                    <div className="absolute top-6 left-6 z-20 bg-emerald-500/80 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <span className="text-white text-xs font-bold">{rt.availableCount} available</span>
                    </div>
                  )}
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="font-heading text-3xl mb-2">{rt.name}</h3>
                  <p className="text-white/60 font-light mb-6 flex-1 line-clamp-2">{rt.description}</p>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-6 mb-6 text-white/50 text-sm">
                    {rt.bedType && (
                      <span className="flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4" /> {rt.bedType}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> {rt.capacity} Guests
                    </span>
                    {rt.size && (
                      <span className="flex items-center gap-1.5">
                        <Maximize className="w-4 h-4" /> {rt.size}
                      </span>
                    )}
                  </div>

                  {/* Facilities */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {rt.facilities?.slice(0, 5).map((f) => (
                      <span key={f} className="px-3 py-1.5 rounded-full bg-white/5 text-white/80 text-xs tracking-wider uppercase font-medium border border-white/10">
                        {f}
                      </span>
                    ))}
                    {(rt.facilities?.length || 0) > 5 && (
                      <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/50 text-xs tracking-wider font-medium border border-white/10">
                        +{rt.facilities!.length - 5} more
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/rooms/${rt.slug}`}
                      className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-sm font-bold uppercase tracking-[0.2em] text-center border border-white/10"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/book/${rt.slug}${bookingParams}`}
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
        )}
      </section>
    </>
  )
}
