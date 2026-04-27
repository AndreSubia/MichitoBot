"use client";

import Image from "next/image";
import { Sparkles, Plus, X } from "lucide-react";
import { Rule } from "../../types";

interface ModalsProps {
  showInviteModal: boolean;
  setShowInviteModal: (val: boolean) => void;
  showRulesModal: boolean;
  setShowRulesModal: (val: boolean) => void;
  rules: Rule[];
  ruleInput: string;
  setRuleInput: (val: string) => void;
  handleCreateRule: (e?: React.FormEvent) => void;
  isCreatingRule: boolean;
}

export function Modals({
  showInviteModal,
  setShowInviteModal,
  showRulesModal,
  setShowRulesModal,
  rules,
  ruleInput,
  setRuleInput,
  handleCreateRule,
  isCreatingRule
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
                Estamos terminando de preparar las maletas de Michito. Muy pronto podrás invitarlo a tu servidor de Discord para que llene tus canales de alegría y ronroneos.
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

      {/* Rules Modal (Mobile) */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border-t border-border rounded-t-[2.5rem] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] w-full max-h-[85vh] flex flex-col gap-6 shadow-2xl animate-in slide-in-from-bottom duration-300 relative">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-2 shrink-0" onClick={() => setShowRulesModal(false)} />
            
            <button 
              onClick={() => setShowRulesModal(false)}
              className="absolute right-6 top-8 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={24} />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="text-orange-500" size={20} />
                Reglas de Entrenamiento
              </h2>
              <p className="text-xs text-muted-foreground">Configura cómo debe comportarse Michito</p>
            </div>

            <form onSubmit={handleCreateRule} className="relative">
              <input 
                type="text"
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                placeholder="Nueva regla (ej: sé sarcástico)"
                className="w-full bg-muted border border-border rounded-2xl py-4 pl-5 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-foreground placeholder:text-muted-foreground"
              />
              <button 
                type="submit"
                disabled={isCreatingRule || !ruleInput.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-xl text-white transition-colors z-30"
              >
                <Plus size={20} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pb-8 custom-scrollbar">
              {rules.length === 0 ? (
                <div className="text-sm text-muted-foreground italic text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border">
                  No hay reglas todavía. ¡Crea la primera!
                </div>
              ) : (
                rules.map((rule) => (
                  <div 
                    key={rule.id}
                    className="p-4 rounded-2xl bg-muted/50 border border-border text-sm text-foreground leading-relaxed hover:border-accent transition-all animate-in fade-in slide-in-from-left-2"
                  >
                    {rule.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
