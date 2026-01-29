"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  Layers,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const items = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "User List", url: "/dashboard/users", icon: Users },
  { title: "Category List", url: "/dashboard/category", icon: Layers },
  { title: "Quiz Organizer", url: "/dashboard/quizzes", icon: BookOpen },
  { title: "Jokes", url: "/dashboard/jokes", icon: BookOpen },
  { title: "Subscription", url: "/dashboard/subscription", icon: CreditCard },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isActiveRoute = (url: string) => {
    if (url === "/dashboard") return pathname === url;
    return pathname.startsWith(url);
  };

  const handleLogout = async () => {
    // close modal first for better UX
    setLogoutOpen(false);

    // redirect to login page after logout (optional)
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 flex flex-col items-center gap-2">
          <div className="rounded-lg">
            <Image
              src="/tennis-logo.png"
              alt="Logo"
              width={400}
              height={400}
              className="w-[61px] h-[95px]"
              priority
            />
          </div>
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">
            I know Tennis
          </span>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className="px-2">
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveRoute(item.url)}
                  tooltip={item.title}
                >
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
              <SidebarMenuButton
                type="button"
                onClick={() => setLogoutOpen(true)}
                tooltip="Logout"
                className="text-red-400 hover:text-red-500"
              >
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* ✅ Logout Confirmation Modal */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout from your account?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            {/* "No" */}
            <AlertDialogCancel type="button">No</AlertDialogCancel>

            {/* "Yes" */}
            <AlertDialogAction
              type="button"
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
