"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface ModalsProps {
  showInviteModal: boolean;
  setShowInviteModal: (val: boolean) => void;
}

export function Modals({ showInviteModal, setShowInviteModal }: ModalsProps) {
  return (
    <>
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border dark:border-white/[0.10] rounded-2xl p-8 max-w-sm w-full shadow-2xl dark:shadow-black/50 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f43f8e] to-[#8b5cf6] flex items-center justify-center shadow-xl shadow-[#f43f8e]/25 mb-1 overflow-hidden">
                <Image src="/avatar.png" alt="Michito" fill className="object-cover p-1.5" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold tracking-tight text-foreground">¡Muy pronto!</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Estamos ultimando detalles para el lanzamiento de Michito. Muy pronto podrás invitarlo a tu servidor de Discord.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="mt-2 w-full bg-gradient-to-r from-[#f43f8e] to-[#a855f7] hover:opacity-90 text-white font-bold py-3 rounded-xl transition-opacity shadow-lg shadow-[#f43f8e]/25"
              >
                ¡Lo esperaré!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
