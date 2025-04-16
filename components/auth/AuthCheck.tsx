"use client";

import { redirect } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    redirect("/login");
    return null;
  }

  return <>{children}</>;
}
