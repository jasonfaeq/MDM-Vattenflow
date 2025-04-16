"use client";

import { Github } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const version = "Demo v0.1.0";

  return (
    <footer className="border-t px-4">
      <div className="container flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
        <div className="flex items-center gap-2">
          <div className="relative px-4 py-1">
            <div className="absolute inset-0 bg-primary/10 rounded-md blur-sm"></div>
            <span className="relative text-xs font-medium text-primary">
              {version}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://divwall.us"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            divwall.us
          </a>
        </div>
      </div>
    </footer>
  );
}
