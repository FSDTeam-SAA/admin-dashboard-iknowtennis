"use client"

import { LayoutDashboard, Users, BookOpen, CreditCard, Settings, LogOut, Layers } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"

const items = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "User List", url: "/dashboard/users", icon: Users },
  { title: "Category List", url: "/dashboard/category", icon: Layers },
  { title: "Quiz Organizer", url: "/dashboard/quizzes", icon: BookOpen },
  { title: "Subscription", url: "/dashboard/subscription", icon: CreditCard },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  const isActiveRoute = (url: string) => {
    if (url === "/dashboard") {
      return pathname === url
    }
    return pathname.startsWith(url)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex flex-col items-center gap-2">
        <div className="rounded-lg">
          <Image src="/tennis-logo.png" alt="Logo" width={400} height={400} className="w-[61px] h-[95px]" />
        </div>
        <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">I know Tennis</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActiveRoute(item.url)} tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="Logout" className="text-red-400 hover:text-red-500">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
