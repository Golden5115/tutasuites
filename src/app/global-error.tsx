"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global System Error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <h2 className="text-2xl font-bold mb-4 text-[#D4AF37]">Tuta Suites</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Something went wrong. Our technical team has been notified.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-xs rounded-xl"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  )
}
