"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ExamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    {
      name: "Radio Group",
      href: "/examples/radio-group",
    },
    {
      name: "Auth Test",
      href: "/examples/auth-test",
    },
    {
      name: "Role-Based Access",
      href: "/examples/role-based-access",
    },
  ];

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Examples</h1>
        <p className="text-muted-foreground">
          This section contains examples of various components and features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        <div className="border rounded-lg p-4 h-fit bg-background">
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
                  pathname === link.href
                    ? "bg-muted font-medium"
                    : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
