import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full flex flex-col">
        <header className="h-16 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between px-6 bg-white/50 dark:bg-background/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="h-5 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground/60 hidden sm:block">Front Desk</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <div className="px-8 py-8 flex-1 max-w-[1400px] mx-auto w-full">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
