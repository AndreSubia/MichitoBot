"use client";

import Image from "next/image";
import { User, Send } from "lucide-react";
import { cn } from "../ui/utils";
import { Message } from "../../types";
import { RefObject } from "react";

interface ChatAreaProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  handleSend: (e?: React.FormEvent) => void;
  isLoading: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  chatContainerRef: RefObject<HTMLDivElement | null>;
}

export function ChatArea({
  messages,
  input,
  setInput,
  handleSend,
  isLoading,
  scrollRef,
  chatContainerRef
}: ChatAreaProps) {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full bg-background theme-transition">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth custom-scrollbar theme-transition"
      >
        <div ref={chatContainerRef} className="space-y-6 theme-transition gsap-reveal-fade-init">
          {messages.map((msg, i) => (
            <div 
              key={i}
              className={cn(
                "flex gap-4 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 theme-transition",
                msg.role === "user" ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden theme-transition",
                msg.role === "assistant" ? "bg-orange-500" : "bg-muted border border-border"
              )}>
                {msg.role === "assistant" ? (
                  <div className="relative w-full h-full theme-transition">
                    <Image src="/avatar.png" alt="Michito" fill className="object-cover p-0.5" />
                  </div>
                ) : <User size={20} className="text-muted-foreground theme-transition" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm theme-transition",
                msg.role === "assistant" 
                  ? "bg-card border border-border text-foreground" 
                  : "bg-orange-600 text-white shadow-orange-900/10"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        {isLoading && (
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center animate-pulse overflow-hidden">
              <div className="relative w-full h-full">
                <Image src="/avatar.png" alt="Michito" fill className="object-cover p-0.5" />
              </div>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 md:p-8 border-t border-border bg-background/95 backdrop-blur-md pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-8 z-20 theme-transition">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative theme-transition">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Habla con Michito..."
            className="w-full bg-muted border border-border rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-base md:text-sm text-foreground placeholder:text-muted-foreground theme-transition"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 rounded-xl transition-colors flex items-center justify-center text-white z-30 theme-transition"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
