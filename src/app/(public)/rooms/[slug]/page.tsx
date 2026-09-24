import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BedDouble, Users, Maximize, Wifi, Wind, Tv, Coffee, ChevronRight, Check, ShieldCheck, Clock } from "lucide-react"
import { prisma } from "@/lib/prisma"

const FACILITY_ICONS: Record<string, any> = {
  "Free WiFi": Wifi,
  "WiFi": Wifi,
  "Air Conditioning": Wind,
  "Smart TV": Tv,
  "Coffee Maker": Coffee,
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RoomDetailPage({ params }: Props) {
  const { slug } = await params

  const roomType = await prisma.roomType.findUnique({
    where: { slug },
    include: { rooms: true },
  })

  if (!roomType) notFound()

  // Fetch similar rooms (other room types)
  const similarRooms = await prisma.roomType.findMany({
    where: { slug: { not: slug } },
    take: 2,
    orderBy: { basePrice: "desc" },
  })

  return (
    <>
      {/* Hero Image */}
      <section className="relative pt-24 pb-0">
        <div className="relative h-[60vh] w-full">
          <Image
            src={roomType.images[0] || "/dsc_0990.jpg"}
            alt={roomType.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-12">
            <div className="max-w-[1200px] mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30">
                  {roomType.bedType}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-wider border border-white/10">
                  {roomType.size}
                </span>
              </div>
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl tracking-tight mb-4">{roomType.name}</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#D4AF37]">₦{roomType.basePrice.toLocaleString()}</span>
                <span className="text-white/50 text-lg">/ night</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="px-6 md:px-16 py-16 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <div>
              <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4">About This Suite</h2>
              <p className="text-white/70 text-lg leading-relaxed">{roomType.description}</p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
                <BedDouble className="w-6 h-6 text-[#D4AF37] mx-auto mb-3" />
                <p className="text-sm font-bold">{roomType.bedType}</p>
                <p className="text-xs text-white/40 mt-1">Bed Type</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
                <Users className="w-6 h-6 text-[#D4AF37] mx-auto mb-3" />
                <p className="text-sm font-bold">{roomType.capacity} Guests</p>
                <p className="text-xs text-white/40 mt-1">Max Capacity</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
                <Maximize className="w-6 h-6 text-[#D4AF37] mx-auto mb-3" />
                <p className="text-sm font-bold">{roomType.size}</p>
                <p className="text-xs text-white/40 mt-1">Room Size</p>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-6">Facilities & Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {roomType.facilities.map((f) => (
                  <div key={f} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
                    <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span className="text-sm text-white/80">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            {roomType.rules && (
              <div>
                <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> House Rules
                </h2>
                <p className="text-white/60 leading-relaxed">{roomType.rules}</p>
              </div>
            )}

            {/* Cancellation */}
            {roomType.cancellation && (
              <div>
                <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Cancellation Policy
                </h2>
                <p className="text-white/60 leading-relaxed">{roomType.cancellation}</p>
              </div>
            )}
          </div>

          {/* Right Column: Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 space-y-6">
              <div className="text-center">
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Starting from</p>
                <p className="text-4xl font-bold text-[#D4AF37]">₦{roomType.basePrice.toLocaleString()}</p>
                <p className="text-white/50 text-sm">per night</p>
              </div>

              <div className="h-px bg-white/10" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Bed Type</span>
                  <span className="text-white font-medium">{roomType.bedType}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Room Size</span>
                  <span className="text-white font-medium">{roomType.size}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Max Guests</span>
                  <span className="text-white font-medium">{roomType.capacity}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Rooms of this type</span>
                  <span className="text-white font-medium">{roomType.rooms.length}</span>
                </div>
              </div>

              <Link
                href={`/book/${roomType.slug}`}
                className="w-full py-4 rounded-xl bg-[#D4AF37] text-black hover:bg-[#F3E5AB] transition-all duration-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2"
              >
                Book This Room
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Rooms */}
      {similarRooms.length > 0 && (
        <section className="px-6 md:px-16 pb-32 max-w-[1600px] mx-auto">
          <h2 className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {similarRooms.map((sr) => (
              <Link key={sr.id} href={`/rooms/${sr.slug}`} className="group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] flex">
                <div className="relative w-48 h-48 shrink-0">
                  <Image src={sr.images[0] || "/dsc_0990.jpg"} alt={sr.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <h3 className="font-heading text-xl mb-1">{sr.name}</h3>
                  <p className="text-white/50 text-sm mb-3 line-clamp-2">{sr.description}</p>
                  <p className="text-[#D4AF37] font-bold">₦{sr.basePrice.toLocaleString()} <span className="text-white/40 font-normal text-xs">/ night</span></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
