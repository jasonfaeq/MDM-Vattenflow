"use client";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { AuthCheck } from "@/components/auth/AuthCheck";
import { TopBar } from "@/components/layout/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthCheck>
        <div className="h-full relative">
          <TopBar />
          <main>
            <div className="h-full p-4 md:p-8">{children}</div>
          </main>
        </div>
      </AuthCheck>
    </ThemeProvider>
  );
}
