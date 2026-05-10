"use client";

import { useState } from "react";
import { Pet } from "../../types";
import { PET_ACTIONS, type PetActionKind } from "@michito/shared";

interface PetActionBarProps {
  pet: Pet | null;
  onPetUpdated: (pet: Pet) => void;
}

const ACTION_ORDER: PetActionKind[] = ["FEED", "PLAY", "SLEEP", "PET"];

export function PetActionBar({ pet, onPetUpdated }: PetActionBarProps) {
  const [pending, setPending] = useState<PetActionKind | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isDead = pet?.state === "DEAD";
  const disabled = !pet || isDead || !!pending;

  const handleClick = async (action: PetActionKind) => {
    if (disabled) return;
    setPending(action);
    setFeedback(null);
    try {
      const res = await fetch("/api/pet/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as {
        pet?: Pet;
        flavor?: string;
        message?: string;
        applied?: boolean;
        error?: string;
      };
      if (data.pet) onPetUpdated(data.pet);
      const text = data.flavor ?? data.message ?? data.error ?? null;
      setFeedback(text);
    } catch {
      setFeedback("Falló la acción.");
    } finally {
      setPending(null);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  if (isDead) {
    return (
      <div className="mt-3 rounded-2xl border border-dashed border-black/[0.10] dark:border-white/[0.10] bg-background/30 p-4 text-center text-xs text-muted-foreground">
        💀 Michi está muerto. Un admin puede revivirlo con <code className="font-mono">/revive</code> en Discord.
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ACTION_ORDER.map((kind) => {
          const def = PET_ACTIONS[kind];
          const isPending = pending === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => handleClick(kind)}
              disabled={disabled}
              className="group inline-flex flex-col items-center gap-1 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-card dark:bg-white/[0.05] p-3 hover:border-[#f43f8e]/30 hover:bg-card dark:hover:bg-white/[0.07] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm dark:shadow-none active:scale-95"
              aria-label={def.label}
            >
              <span className="text-lg leading-none">{isPending ? "⏳" : def.emoji}</span>
              <span className="text-[11px] font-medium text-foreground">{def.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 h-4 text-center text-[11px] text-muted-foreground transition-opacity duration-200" aria-live="polite">
        {feedback ?? " "}
      </div>
    </div>
  );
}
