import { PublicNav } from "@/components/public-nav"
import { PublicFooter } from "@/components/public-footer"

export const dynamic = "force-dynamic"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black flex flex-col">
      <PublicNav />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
