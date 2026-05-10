"use client";

import { useEffect, useState } from "react";
import { Heart, Drumstick, Zap, Smile } from "lucide-react";
import { Pet, PetState } from "../../types";

interface PetStatusProps {
  pet: Pet | null;
  error: string | null;
}

const STATE_META: Record<PetState, { label: string; emoji: string; tone: string }> = {
  ALIVE:    { label: "vivo",      emoji: "🟢", tone: "text-emerald-500 dark:text-emerald-300" },
  SLEEPING: { label: "durmiendo", emoji: "😴", tone: "text-sky-500 dark:text-sky-300" },
  SICK:     { label: "enfermo",   emoji: "🤒", tone: "text-amber-500 dark:text-amber-300" },
  DEAD:     { label: "muerto",    emoji: "💀", tone: "text-zinc-500 dark:text-zinc-400" },
};

interface BarProps {
  label: string;
  value: number;
  /** When true, render the bar from the right ("less is better" stat). */
  inverted?: boolean;
  icon: React.ReactNode;
  danger?: boolean;
}

function StatBar({ label, value, inverted = false, icon, danger = false }: BarProps) {
  const safe = Math.max(0, Math.min(100, value));
  const fillPct = inverted ? 100 - safe : safe;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="opacity-80">{icon}</span>
          {label}
        </span>
        <span
          className={
            danger
              ? "font-mono text-rose-500 dark:text-rose-300"
              : "font-mono text-foreground"
          }
        >
          {Math.round(safe)}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/70 dark:bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${fillPct}%`,
            background: danger
              ? "linear-gradient(to right, #f43f5e, #fb7185)"
              : "linear-gradient(to right, #f43f8e, #a855f7)",
          }}
        />
      </div>
    </div>
  );
}

const formatDuration = (ms: number): string => {
  const abs = Math.abs(ms);
  const sec = Math.round(abs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.round(min / 60);
  return `${hr} h`;
};

const formatPast = (iso: string, now: number): string => {
  const d = new Date(iso);
  return `hace ${formatDuration(now - d.getTime())}`;
};

/** Re-render hook for live relative-time displays. Cheap: no fetch, just state bump. */
const useNow = (intervalMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};

const OVERDUE_WARNING_MS = 2 * 60 * 1000;

interface NextTickLabelProps {
  pet: Pet;
  now: number;
  isDead: boolean;
}

function NextTickLabel({ pet, now, isDead }: NextTickLabelProps) {
  if (isDead) {
    return (
      <span>
        {pet.diedAt ? `Murió ${formatPast(pet.diedAt, now)}` : "Murió"}
      </span>
    );
  }
  const diff = new Date(pet.nextTickAt).getTime() - now;
  if (diff >= 0) {
    return <span>Próximo tick en {formatDuration(diff)}</span>;
  }
  const overdue = -diff;
  const warn = overdue >= OVERDUE_WARNING_MS;
  return (
    <span
      className={warn ? "text-amber-600 dark:text-amber-400" : undefined}
      title={
        warn
          ? "El worker no está procesando ticks. Revisa que `pnpm --filter @michito/worker dev` esté corriendo."
          : undefined
      }
    >
      {warn ? "⚠️ " : ""}Tick atrasado {formatDuration(overdue)}
    </span>
  );
}

export function PetStatus({ pet, error }: PetStatusProps) {
  const now = useNow(1000);

  if (error && !pet) {
    return (
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Heart size={16} className="text-[#c084fc]" />
          <span>Estado de Michi</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          No se pudo cargar el estado ({error}).
        </p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Heart size={16} className="text-[#c084fc]" />
          <span>Estado de Michi</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 rounded-lg bg-muted/60 dark:bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  const state = STATE_META[pet.state];
  const isDead = pet.state === "DEAD";
  const hungerDanger = pet.hunger >= 90;
  const energyDanger = pet.energy <= 5;
  const healthDanger = pet.health <= 25;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        isDead
          ? "border-black/[0.05] bg-zinc-200/40 dark:border-white/[0.06] dark:bg-white/[0.02]"
          : "border-black/[0.06] dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Heart size={16} className="text-[#c084fc]" />
          <span>Estado de Michi</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${state.tone}`}
        >
          <span className="text-[11px] leading-none">{state.emoji}</span>
          {state.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
        <StatBar
          label="Hambre"
          value={pet.hunger}
          inverted
          danger={hungerDanger}
          icon={<Drumstick size={11} />}
        />
        <StatBar
          label="Energía"
          value={pet.energy}
          danger={energyDanger}
          icon={<Zap size={11} />}
        />
        <StatBar
          label="Salud"
          value={pet.health}
          danger={healthDanger}
          icon={<Heart size={11} />}
        />
        <StatBar
          label="Ánimo"
          value={pet.mood}
          icon={<Smile size={11} />}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.06] pt-3 text-[11px] text-muted-foreground">
        <span>
          Nivel <span className="font-mono text-foreground">{pet.level}</span> ·{" "}
          <span className="font-mono">{pet.xp}</span> XP
        </span>
        <NextTickLabel pet={pet} now={now} isDead={isDead} />
      </div>
    </div>
  );
}
