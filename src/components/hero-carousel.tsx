"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const HERO_IMAGES = [
  {
    src: "/hero.png",
    alt: "Tuta Suites Exterior"
  },
  {
    src: "/signature.png",
    alt: "Signature Suite"
  },
  {
    src: "/executive.png",
    alt: "Executive Suite"
  }
]

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {HERO_IMAGES.map((image, index) => (
        <Image 
          key={image.src}
          src={image.src} 
          alt={image.alt} 
          fill 
          className={`object-cover object-center opacity-60 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-60" : "opacity-0"
          }`}
          priority={index === 0}
        />
      ))}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all duration-300 rounded-full bg-white ${
              index === currentIndex ? "w-8 h-2 opacity-100" : "w-2 h-2 opacity-50 hover:opacity-75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </>
  )
}
