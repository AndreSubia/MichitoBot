"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface ModalsProps {
  showInviteModal: boolean;
  setShowInviteModal: (val: boolean) => void;
}

export function Modals({
  showInviteModal,
  setShowInviteModal
}: ModalsProps) {
  return (
    <>
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-2">
                <div className="relative w-16 h-16">
                  <Image src="/avatar.png" alt="Michito" fill className="object-cover" />
                </div>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">¡Muy pronto! 🐾</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Estamos ultimando detalles para el lanzamiento de Michito. Muy pronto podrás invitarlo a tu servidor de Discord.
              </p>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
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
