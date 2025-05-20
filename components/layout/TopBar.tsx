"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, ShieldAlert, LayoutDashboard, FileText, Settings, Book, Users, BarChart3, Server } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

const mainRoutes = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Request", href: "/requests/new", icon: FileText },
  { label: "User Information", href: "/settings", icon: Settings },
  { label: "Documentation", href: "/docs", icon: Book },
];

const adminRoutes = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Requests", href: "/admin/requests", icon: FileText },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "System Info", href: "/admin/system-info", icon: Server },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function TopBar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "MDM";

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg rounded-b-2xl topbar">
      <div className="h-20 flex items-center justify-between px-4 md:px-12">
        {/* Logo and Main Nav */}
        <div className="flex items-center gap-10">
          <Logo className="h-14 w-auto mr-2" />
          <nav className="hidden md:flex gap-3 items-center">
            {mainRoutes.map((route) => {
              const Icon = route.icon;
              let isActive = pathname === route.href;
              if (pathname === "/requests/new") {
                isActive = route.href === "/requests/new";
              } else {
                isActive = isActive || (pathname.startsWith(route.href) && route.href !== "/dashboard");
              }
              return (
                <Button key={route.href} variant={isActive ? "secondary" : "ghost"} className={cn("justify-start relative group/nav px-5 py-2 text-base font-semibold rounded-xl transition-all duration-200", { "bg-zinc-100 dark:bg-zinc-800": isActive })} asChild>
                  <Link href={route.href} className="flex items-center gap-2">
                    {Icon && <Icon className="h-5 w-5" />} {route.label}
                  </Link>
                </Button>
              );
            })}
            {isAdmin && (
              <Button variant="outline" className="justify-start ml-4 px-5 py-2 text-base font-semibold rounded-xl transition-all duration-200" asChild>
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> Admin Dashboard
                </Link>
              </Button>
            )}
          </nav>
        </div>
        {/* User/Theme/Dropdown */}
        <div className="flex items-center gap-3">
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-2xl flex items-center gap-2 px-4 py-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {user?.displayName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start text-base">
                  <span className="font-medium leading-none">{user?.displayName || user?.email}</span>
                  <span className="text-xs text-muted-foreground leading-none">{user?.role || 'User'}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem disabled>
                <span className="font-medium">{user?.displayName}</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span className="text-sm text-muted-foreground">{user?.email}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Mobile menu button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden ml-2">
                <Menu className="size-6 text-muted-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {mainRoutes.map((route) => {
                  const Icon = route.icon;
                  let isActive = pathname === route.href;
                  if (pathname === "/requests/new") {
                    isActive = route.href === "/requests/new";
                  } else {
                    isActive = isActive || (pathname.startsWith(route.href) && route.href !== "/dashboard");
                  }
                  return (
                    <Button key={route.href} variant={isActive ? "secondary" : "ghost"} className={cn("justify-start w-full", { "bg-zinc-100 dark:bg-zinc-800": isActive })} asChild onClick={() => setMobileOpen(false)}>
                      <Link href={route.href} className="flex items-center gap-2 w-full">
                        {Icon && <Icon className="h-4 w-4" />} {route.label}
                      </Link>
                    </Button>
                  );
                })}
                {isAdmin && (
                  <Button variant="outline" className="justify-start w-full mt-2" asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/admin/dashboard" className="flex items-center gap-2 w-full">
                      <ShieldAlert className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  </Button>
                )}
                {/* Admin section in mobile */}
                {isAdmin && (
                  <>
                    <div className="mt-4 mb-2 text-xs font-semibold text-muted-foreground">Admin Panel</div>
                    {adminRoutes.map((route) => {
                      const Icon = route.icon;
                      const isActive = pathname === route.href || (pathname.startsWith(route.href) && route.href !== "/admin/dashboard");
                      return (
                        <Button key={route.href} variant={isActive ? "secondary" : "ghost"} className={cn("justify-start w-full", { "bg-secondary/10": isActive })} asChild onClick={() => setMobileOpen(false)}>
                          <Link href={route.href} className="flex items-center gap-2 w-full">
                            {Icon && <Icon className="h-4 w-4" />} {route.label}
                          </Link>
                        </Button>
                      );
                    })}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 