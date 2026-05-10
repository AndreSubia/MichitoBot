"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { Pet } from "../../types";
import { PetStatus } from "./pet-status";
import { PetActionBar } from "./pet-action-bar";

interface PetStatusModalProps {
  open: boolean;
  onClose: () => void;
  pet: Pet | null;
  error: string | null;
  onPetUpdated: (pet: Pet) => void;
}

export function PetStatusModal({ open, onClose, pet, error, onPetUpdated }: PetStatusModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-sm bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-2 shadow-2xl dark:shadow-black/50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Estado de Michi"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
        <PetStatus pet={pet} error={error} />
        <div className="px-3 pb-3">
          <PetActionBar pet={pet} onPetUpdated={onPetUpdated} />
        </div>
      </div>
    </div>
  );
}
