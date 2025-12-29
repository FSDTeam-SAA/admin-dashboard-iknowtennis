import type React from "react"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between bg-white px-6 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-full hover:bg-muted">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
              </button>
              <div className="flex items-center gap-3 pl-2 border-l">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold leading-none">Rani</p>
                  <p className="text-xs text-muted-foreground">@Admin</p>
                </div>
                <Avatar className="w-9 h-9">
                  <AvatarImage src="/admin-avatar.png" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
