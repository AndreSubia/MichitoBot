"use client";

import Image from "next/image";
import { Sparkles, Plus } from "lucide-react";
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
  setShowRulesModal: (val: boolean) => void;
  setShowInviteModal: (val: boolean) => void;
}

export function MobileHeader({
  headerRef,
  avatarRefMobile,
  toggleTheme,
  sunRef,
  moonRef,
  resolvedTheme,
  mounted,
  setShowRulesModal,
  setShowInviteModal
}: MobileHeaderProps) {
  return (
    <header 
      ref={headerRef}
      className="flex items-center justify-between px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-border/50 fixed top-0 left-0 right-0 z-[60] theme-transition glass-header gsap-reveal-fade-init"
    >
      <div className="flex items-center gap-3">
        <div ref={avatarRefMobile} className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border theme-transition">
          <Image 
            src="/avatar.png" 
            alt="Michito Avatar" 
            fill 
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight theme-transition">Michito Bot</h1>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">En línea</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle 
          toggleTheme={toggleTheme}
          sunRef={sunRef}
          moonRef={moonRef}
          resolvedTheme={resolvedTheme}
          mounted={mounted}
        />
        <div className="flex items-center gap-2 md:hidden">
          <button 
            onClick={() => setShowRulesModal(true)}
            className="p-2 bg-muted border border-border rounded-xl text-muted-foreground hover:text-orange-500 transition-colors"
          >
            <Sparkles size={20} />
          </button>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
