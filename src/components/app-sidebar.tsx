import { Calendar, Home, Users, BedDouble, FileText, Settings, Sparkles } from "lucide-react"
import Image from "next/image"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Reservations",
    url: "/reservations",
    icon: FileText,
  },
  {
    title: "Rooms",
    url: "/rooms",
    icon: BedDouble,
  },
  {
    title: "Guests",
    url: "/guests",
    icon: Users,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-[rgba(9,9,11,0.95)] backdrop-blur-2xl">
      <SidebarHeader className="px-6 pt-8 pb-6 flex flex-col items-center justify-center border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="relative w-36 h-18 mb-3">
          <Image
            src="/logo.png"
            alt="TutaSuites Logo"
            fill
            className="object-contain dark:invert"
            priority
          />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60 text-center mt-1">
          Tatasuites Management System
        </p>
      </SidebarHeader>
      <SidebarContent className="px-3 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/40 uppercase tracking-[0.2em] text-[10px] font-bold mb-3 px-4">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="hover:bg-primary/8 dark:hover:bg-primary/10 hover:text-foreground transition-all duration-200 rounded-xl py-3 px-4 group/btn"
                    render={<a href={item.url} />}
                  >
                    <div className="flex items-center gap-3.5 w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/8 dark:bg-primary/10 group-hover/btn:bg-primary/15 dark:group-hover/btn:bg-primary/20 transition-colors">
                        <item.icon className="h-4 w-4 text-primary/80" />
                      </div>
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-4 border-t border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 dark:bg-primary/8 border border-primary/10 dark:border-primary/15">
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
          <span className="text-[11px] font-medium text-muted-foreground/70">v1.0 — Premium</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
