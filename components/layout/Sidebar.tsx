"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  List,
  Settings,
  ShieldAlert,
  Book,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
const routes = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "New Request",
    href: "/requests/new",
    icon: FileText,
  },
  {
    label: "My Requests",
    href: "/requests",
    icon: List,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Documentation",
    href: "/docs",
    icon: Book,
  },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  console.log(pathname);

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-secondary/10">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold">MDM Vatenflow</h1>
        </Link>
        <Separator />

        <div className="space-y-1">
          {routes.map((route) => {
            const Icon = route.icon;
            let isActive = pathname === route.href;

            // Special handling for /requests/new to not activate parent /requests
            if (pathname === "/requests/new") {
              isActive = route.href === "/requests/new";
            } else {
              isActive =
                isActive ||
                (pathname.startsWith(route.href) &&
                  route.href !== "/dashboard");
            }

            return (
              <Button
                key={route.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", {
                  "bg-zinc-100 dark:bg-zinc-800": isActive,
                })}
                asChild
              >
                <Link href={route.href}>
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {route.label}
                </Link>
              </Button>
            );
          })}

          {isAdmin && (
            <Button
              variant="outline"
              className="w-full justify-start mt-6 bg-background"
              asChild
            >
              <Link href="/admin/dashboard">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
