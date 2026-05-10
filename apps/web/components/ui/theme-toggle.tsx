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

export function ThemeToggle({
  toggleTheme,
  sunRef,
  moonRef,
  resolvedTheme,
  mounted,
  className,
}: ThemeToggleProps) {
  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-xl bg-muted/60 hover:bg-muted dark:bg-white/[0.06] dark:hover:bg-white/[0.10] text-muted-foreground border border-border dark:border-white/[0.08] overflow-hidden relative transition-colors",
        className
      )}
      aria-label="Toggle theme"
    >
      <div className="relative w-[18px] h-[18px] flex items-center justify-center">
        <div
          ref={sunRef}
          className={cn(
            "absolute",
            resolvedTheme === "dark" ? "opacity-0 invisible" : "opacity-100 visible"
          )}
        >
          <Sun size={18} />
        </div>
        <div
          ref={moonRef}
          className={cn(
            "absolute",
            resolvedTheme === "dark" ? "opacity-100 visible" : "opacity-0 invisible"
          )}
        >
          <Moon size={18} />
        </div>
      </div>
    </button>
  );
}
