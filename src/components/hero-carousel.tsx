"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Star } from "lucide-react"

const HERO_IMAGES = [
  {
    src: "/dsc_0988.jpg",
    alt: "Tuta Suites Experience",
    titleLine1: "Uncompromising",
    titleLine2: "Luxury & Elegance",
    subtitle: "Experience the pinnacle of hospitality in the heart of the city. Where every detail is curated for your absolute comfort."
  },
  {
    src: "/dsc_0986.jpg",
    alt: "Premium Dining",
    titleLine1: "World-Class",
    titleLine2: "Culinary Excellence",
    subtitle: "Indulge your senses with our world-class dining options, crafted to perfection."
  },
  {
    src: "/dsc_1032.jpg",
    alt: "Relaxation and Comfort",
    titleLine1: "Unwind in",
    titleLine2: "Absolute Style",
    subtitle: "Your perfect getaway for relaxation and rejuvenation awaits you."
  }
]

export function HeroCarousel({ children }: { children?: React.ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const goToSlide = (next: number) => {
    if (next === currentIndex || isTransitioning) return
    setPrevIndex(currentIndex)
    setIsTransitioning(true)
    setCurrentIndex(next)

    // Clear transition lock after the crossfade completes
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsTransitioning(false), 1200)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevIndex((prev) => {
        const current = (prev + 1) % HERO_IMAGES.length
        // We read currentIndex indirectly via the updater
        return prev // just trigger re-render from the main setter below
      })
      setCurrentIndex((prev) => {
        const next = (prev + 1) % HERO_IMAGES.length
        setPrevIndex(prev)
        setIsTransitioning(true)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setIsTransitioning(false), 1200)
        return next
      })
    }, 6000)
    return () => {
      clearInterval(timer)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <>
      {/* ── Image layers: previous stays visible, current fades in on top ── */}
      {HERO_IMAGES.map((image, index) => {
        // Determine the visual state for each image
        const isCurrent = index === currentIndex
        const isPrev = index === prevIndex && isTransitioning

        // Only render visible layers (current + previous during transition)
        const isVisible = isCurrent || isPrev

        return (
          <div
            key={image.src}
            className="absolute inset-0"
            style={{
              zIndex: isCurrent ? 2 : isPrev ? 1 : 0,
              opacity: isVisible ? 1 : 0,
              transition: isCurrent ? "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover object-center"
              style={{
                transform: isCurrent ? "scale(1.06)" : "scale(1)",
                transition: "transform 8s cubic-bezier(0.25, 0.1, 0.25, 1)",
              }}
              priority={index === 0}
            />
          </div>
        )
      })}

      {/* ── Cinematic overlay: subtle vignette + gradient ── */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: [
            "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.9) 100%)",
            "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.45) 100%)",
          ].join(", "),
        }}
      />

      {/* ── Hero text content ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-6 max-w-5xl mx-auto mt-20">
        <div className="relative w-full h-[200px] md:h-[300px] flex justify-center items-center pointer-events-none mb-6 md:mb-10">
          {HERO_IMAGES.map((image, index) => {
            const isActive = index === currentIndex
            return (
              <div
                key={`text-${index}`}
                className="absolute flex flex-col items-center text-center"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateY(0)" : "translateY(24px)",
                  transition: isActive
                    ? "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s"
                    : "opacity 0.5s ease-out, transform 0.5s ease-out",
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                </div>
                <h1 className="font-heading text-4xl md:text-6xl lg:text-8xl font-medium tracking-tight mb-6 leading-[1.1] drop-shadow-2xl">
                  {image.titleLine1} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF8D6] to-[#D4AF37]">
                    {image.titleLine2}
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-white/95 max-w-2xl font-light drop-shadow-lg">
                  {image.subtitle}
                </p>
              </div>
            )
          })}
        </div>

        {/* Search Availability Form (Children) */}
        <div className="w-full relative z-30">
          {children}
        </div>
      </div>

      {/* ── Slide indicators ── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-500 rounded-full ${
              index === currentIndex
                ? "w-10 h-2 bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.6)]"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </>
  )
}
