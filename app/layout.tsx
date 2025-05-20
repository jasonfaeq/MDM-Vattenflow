import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MDM Vattenflow",
  description: "Master Data Management Request System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <div className="h-full bg-background text-foreground">
            {children}
            <Toaster position="top-right" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
