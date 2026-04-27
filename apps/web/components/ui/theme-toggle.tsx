"use client";

import { Sun, Moon } from "lucide-react";
import { cn } from "../ui/utils";
import { RefObject } from "react";

interface ThemeToggleProps {
  toggleTheme: () => void;
  sunRef: RefObject<HTMLDivElement | null>;
  moonRef: RefObject<HTMLDivElement | null>;
  resolvedTheme?: string;
  mounted: boolean;
  className?: string;
}

export function ThemeToggle({ toggleTheme, sunRef, moonRef, resolvedTheme, mounted, className }: ThemeToggleProps) {
  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground border border-border group overflow-hidden relative",
        className
      )}
      aria-label="Toggle theme"
    >
      <div className="relative w-[18px] h-[18px] flex items-center justify-center">
        <div ref={sunRef} className={cn(
          "absolute",
          resolvedTheme === "dark" ? "opacity-0 invisible" : "opacity-100 visible"
        )}>
          <Sun size={18} />
        </div>
        <div ref={moonRef} className={cn(
          "absolute",
          resolvedTheme === "dark" ? "opacity-100 visible" : "opacity-0 invisible"
        )}>
          <Moon size={18} />
        </div>
      </div>
    </button>
  );
}
