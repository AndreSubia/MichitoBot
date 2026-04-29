"use client";

import { Settings, Sparkles, Plus, ExternalLink } from "lucide-react";
import { Rule } from "../../types";
import { RefObject } from "react";

interface SidebarProps {
  sidebarRef: RefObject<HTMLDivElement | null>;
  rules: Rule[];
  ruleInput: string;
  setRuleInput: (val: string) => void;
  handleCreateRule: (e?: React.FormEvent) => void;
  isCreatingRule: boolean;
  setShowInviteModal: (val: boolean) => void;
}

export function Sidebar({
  sidebarRef,
  rules,
  ruleInput,
  setRuleInput,
  handleCreateRule,
  isCreatingRule,
  setShowInviteModal
}: SidebarProps) {
  return (
    <div ref={sidebarRef} className="w-80 h-full border-r border-border p-6 flex flex-col gap-6 overflow-y-auto bg-card gsap-reveal-stagger-init theme-transition pt-24">
      <button 
        onClick={() => setShowInviteModal(true)}
        className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 theme-transition group text-left w-full"
      >
        <div className="flex flex-col">
          <span className="text-xs font-bold text-orange-500 dark:text-orange-400">¿Quieres a Michito?</span>
          <span className="text-[10px] text-orange-500/70 dark:text-orange-400/70">Añádelo a tu Discord</span>
        </div>
        <ExternalLink size={16} className="text-orange-500 dark:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
      </button>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Settings size={16} />
          <span>ESTADO DEL MODELO</span>
        </div>
        <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Personalidad</span>
            <span className="text-orange-500 dark:text-orange-400 font-mono">Dinámica</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Reglas Activas</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-mono">{rules.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Sparkles size={16} />
            <span>REGLAS DE ENTRENAMIENTO</span>
          </div>
        </div>
        
        <form onSubmit={handleCreateRule} className="relative">
          <input 
            type="text"
            value={ruleInput}
            onChange={(e) => setRuleInput(e.target.value)}
            placeholder="Nueva regla (ej: sé sarcástico)"
            className="w-full bg-muted border border-border rounded-lg py-2 pl-3 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50 text-foreground placeholder:text-muted-foreground"
          />
          <button 
            type="submit"
            disabled={isCreatingRule || !ruleInput.trim()}
            className="absolute right-1.5 top-1.5 p-1 bg-background hover:bg-accent disabled:opacity-50 rounded text-muted-foreground"
          >
            <Plus size={14} />
          </button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {rules.length === 0 ? (
            <div className="text-[10px] text-muted-foreground italic text-center py-4">
              No hay reglas todavía. ¡Crea la primera!
            </div>
          ) : (
            rules.map((rule) => (
              <div 
                key={rule.id}
                className="p-3 rounded-lg bg-muted/30 border border-border text-[11px] text-foreground leading-relaxed hover:border-accent transition-colors"
              >
                {rule.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
