import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getSiteSettings } from "@/app/actions/booking-actions"
import { BookingForm } from "@/components/booking-form"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    checkIn?: string
    checkOut?: string
    adults?: string
    children?: string
  }>
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams

  const roomType = await prisma.roomType.findUnique({ where: { slug } })
  if (!roomType) notFound()

  const settings = await getSiteSettings()

  return (
    <>
      <section className="relative pt-40 pb-12 px-6 md:px-16">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-[0.3em] mb-4">Book Your Stay</p>
          <h1 className="font-heading text-4xl md:text-5xl tracking-tight mb-2">{roomType.name}</h1>
          <p className="text-white/50">Complete your reservation in a few simple steps.</p>
        </div>
      </section>

      <section className="px-6 md:px-16 pb-32 max-w-[1200px] mx-auto">
        <BookingForm
          roomType={{
            name: roomType.name,
            slug: roomType.slug,
            basePrice: roomType.basePrice,
            capacity: roomType.capacity,
            images: roomType.images,
          }}
          settings={{
            taxPercent: settings.taxPercent,
            servicePercent: settings.servicePercent,
            currencySymbol: settings.currencySymbol,
          }}
          initialCheckIn={sp.checkIn}
          initialCheckOut={sp.checkOut}
          initialAdults={sp.adults ? Number(sp.adults) : undefined}
          initialChildren={sp.children ? Number(sp.children) : undefined}
        />
      </section>
    </>
  )
}
