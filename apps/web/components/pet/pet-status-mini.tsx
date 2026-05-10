"use client";

import { Drumstick, Zap, Heart, Smile } from "lucide-react";
import { Pet } from "../../types";

const PET_STATE_PILL: Record<Pet["state"], { dot: string; label: string }> = {
  ALIVE:    { dot: "bg-emerald-400 shadow-emerald-400/60", label: "vivo" },
  SLEEPING: { dot: "bg-sky-400 shadow-sky-400/60",         label: "durmiendo" },
  SICK:     { dot: "bg-amber-400 shadow-amber-400/60",     label: "enfermo" },
  DEAD:     { dot: "bg-zinc-500 shadow-zinc-500/40",       label: "muerto" },
};

interface MiniStatProps {
  icon: React.ReactNode;
  value: number;
  inverted?: boolean;
  label: string;
}

function MiniStat({ icon, value, inverted = false, label }: MiniStatProps) {
  const safe = Math.max(0, Math.min(100, value));
  const display = Math.round(safe);
  const effective = inverted ? 100 - safe : safe;
  const tone =
    effective < 25
      ? "text-rose-500 dark:text-rose-300"
      : effective < 60
        ? "text-amber-500 dark:text-amber-400"
        : "text-foreground";
  return (
    <span
      title={`${label}: ${display}/100`}
      className={`inline-flex items-center gap-1 text-[11px] font-mono ${tone}`}
    >
      <span className="opacity-70">{icon}</span>
      {display}
    </span>
  );
}

interface PetStatusMiniProps {
  pet: Pet | null;
  onOpen: () => void;
}

export function PetStatusMini({ pet, onOpen }: PetStatusMiniProps) {
  if (!pet) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="hidden md:inline-flex items-center gap-2 rounded-full bg-muted/40 dark:bg-white/[0.04] px-3 py-1 border border-border/60 dark:border-white/[0.06] hover:bg-muted/60 dark:hover:bg-white/[0.08] transition-colors animate-pulse"
        aria-label="Cargando estado"
      >
        <span className="text-[11px] text-muted-foreground">Cargando…</span>
      </button>
    );
  }

  const pill = PET_STATE_PILL[pet.state];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="hidden md:inline-flex items-center gap-3 rounded-full bg-muted/40 dark:bg-white/[0.04] px-3 py-1 border border-border/60 dark:border-white/[0.06] hover:bg-muted/60 dark:hover:bg-white/[0.08] transition-colors"
      aria-label="Ver estado de Michi"
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${pill.dot}`} />
        {pill.label}
      </span>
      <span className="h-3 w-px bg-border/80 dark:bg-white/[0.10]" aria-hidden />
      <span className="inline-flex items-center gap-3">
        <MiniStat icon={<Drumstick size={11} />} value={pet.hunger} inverted label="Hambre" />
        <MiniStat icon={<Zap size={11} />} value={pet.energy} label="Energía" />
        <MiniStat icon={<Heart size={11} />} value={pet.health} label="Salud" />
        <MiniStat icon={<Smile size={11} />} value={pet.mood} label="Ánimo" />
      </span>
    </button>
  );
}
