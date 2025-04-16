"use client";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { AuthCheck } from "@/components/auth/AuthCheck";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Header } from "@/components/layout/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Handle admin role detection properly
  const isAdmin = user?.role === "MDM";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthCheck>
        <div className="h-full relative">
          {/* Desktop sidebar */}
          <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-background">
            <Sidebar isAdmin={isAdmin} />
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
              <div className="flex-1">
                <Sidebar isAdmin={isAdmin} />
              </div>
            </SheetContent>
          </Sheet>

          <main className="md:pl-72 md:pr-4">
            <Header />
            <div className="h-full p-4 md:p-8">{children}</div>
          </main>
        </div>
      </AuthCheck>
    </ThemeProvider>
  );
}
