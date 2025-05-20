"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { TopBar } from "@/components/layout/TopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

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
        <TopBar />
        <main>
          <div className="h-full p-4 md:p-8">{children}</div>
        </main>
      </div>
    </ThemeProvider>
  );
}
