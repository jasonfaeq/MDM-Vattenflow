"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/app/providers/theme-provider";
import {
  Menu,
  Home,
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const adminRoutes = [
  {
    label: "Overview",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Requests",
    href: "/admin/requests",
    icon: FileText,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "System Info",
    href: "/admin/system-info",
    icon: Server,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "MDM") {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="h-full relative">
        {/* Desktop sidebar */}
        <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-background border-r">
          <div className="space-y-4 py-4 flex flex-col h-full">
            <div className="px-3 py-2 flex-1">
              <div className="flex items-center pl-3 mb-10">
                <h1 className="text-2xl ">
                  Vattenflow{" "}
                  <Badge variant="destructive" className="ml-2">
                    Admin
                  </Badge>
                </h1>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start mb-6"
                asChild
              >
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Back to App
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>

              <div className="space-y-1">
                {adminRoutes.map((route) => {
                  const Icon = route.icon;
                  const isActive =
                    pathname === route.href ||
                    (pathname.startsWith(route.href) &&
                      route.href !== "/admin/dashboard");

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
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar with Sheet component */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden fixed top-4 left-4 z-[888]"
            >
              <Menu className="size-6 text-muted-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4 flex flex-col h-full">
              <div className="px-3 py-2 flex-1">
                <div className="flex items-center pl-3 mb-10">
                  <h1 className="text-xl md:text-2xl font-bold">
                    Admin Dashboard
                  </h1>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start mb-6"
                  asChild
                >
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Back to App
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>

                <div className="space-y-1">
                  {adminRoutes.map((route) => {
                    const Icon = route.icon;
                    const isActive =
                      pathname === route.href ||
                      (pathname.startsWith(route.href) &&
                        route.href !== "/admin/dashboard");

                    return (
                      <Button
                        key={route.href}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn("w-full justify-start", {
                          "bg-secondary/10": isActive,
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
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <main className="md:pl-72 md:pr-4">
          <div className="h-full p-4 md:p-8">{children}</div>
        </main>
      </div>
    </ThemeProvider>
  );
}
