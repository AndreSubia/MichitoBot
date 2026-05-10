"use client";

import Image from "next/image";
import { ThemeToggle } from "../ui/theme-toggle";
import { RefObject } from "react";

interface MobileHeaderProps {
  headerRef?: RefObject<HTMLElement | null>;
  avatarRefMobile: RefObject<HTMLDivElement | null>;
  toggleTheme: () => void;
  sunRef: RefObject<HTMLDivElement | null>;
  moonRef: RefObject<HTMLDivElement | null>;
  resolvedTheme?: string;
  mounted: boolean;
}

export function MobileHeader({
  headerRef,
  avatarRefMobile,
  toggleTheme,
  sunRef,
  moonRef,
  resolvedTheme,
  mounted,
}: MobileHeaderProps) {
  return (
    <header
      ref={headerRef}
      className="flex items-center justify-between px-5 py-3.5 pt-[calc(0.875rem+env(safe-area-inset-top))] border-b border-border/50 dark:border-white/[0.07] fixed top-0 left-0 right-0 z-[60] theme-transition glass-header vt-header gsap-reveal-fade-init"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          ref={avatarRefMobile}
          className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-[#f43f8e] to-[#8b5cf6] shadow-md shadow-[#f43f8e]/20 shrink-0"
        >
          <Image src="/avatar.png" alt="Michito Avatar" fill className="object-cover p-0.5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold tracking-tight truncate max-w-[52vw]">Michito Bot</h1>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/60 shrink-0" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
              En línea
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle
          toggleTheme={toggleTheme}
          sunRef={sunRef}
          moonRef={moonRef}
          resolvedTheme={resolvedTheme}
          mounted={mounted}
        />
      </div>
    </header>
  );
}
