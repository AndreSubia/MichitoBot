"use client";

import Image from "next/image";
import { Send, Sparkles, User } from "lucide-react";
import { cn } from "../ui/utils";
import { Message } from "../../types";
import { RefObject, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ChatAreaProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  chatContainerRef: RefObject<HTMLDivElement | null>;
  rulesCount?: number;
  className?: string;
}

export function ChatArea({
  messages,
  input,
  setInput,
  onSubmit,
  isLoading,
  scrollRef,
  chatContainerRef,
  rulesCount,
  className
}: ChatAreaProps) {
  const chatRowAnimatedRef = useRef<WeakSet<Element>>(new WeakSet());

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const container = chatContainerRef.current;
    if (!scroller || !container) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: reduce)", () => {});
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-chat-row]"));
        rows.forEach((row) => {
          if (chatRowAnimatedRef.current.has(row)) return;
          chatRowAnimatedRef.current.add(row);

          gsap.fromTo(
            row,
            { y: 14, opacity: 0, scale: 0.985 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.55,
              ease: "power2.out",
              scrollTrigger: {
                trigger: row,
                scroller,
                start: "top 92%",
                end: "top 70%",
                toggleActions: "play none none reverse"
              }
            }
          );
        });

        ScrollTrigger.refresh();
      }, container);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [messages.length, scrollRef, chatContainerRef]);

  return (
    <section className="w-full h-full">
      <div
        data-chat-shell
        className={cn(
          "relative rounded-3xl border border-border bg-background/88 glass-header [--glass-alpha:0.9] [--glass-blur:32px] overflow-hidden flex flex-col h-full",
          className
        )}
      >
        <div className="absolute top-0 left-0 right-0 z-10 border-b border-border/50 glass-header [--glass-alpha:0.9] [--glass-blur:32px]">
          <div className="px-5 md:px-6 py-4 flex items-center justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-muted-foreground tracking-wider">CHAT</div>
            <div className="mt-1 text-lg font-bold tracking-tight truncate">Habla con Michito</div>
          </div>
          {typeof rulesCount === "number" && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] text-muted-foreground glass-header">
              <Sparkles size={14} className="text-orange-500" />
              {rulesCount} reglas
            </div>
          )}
        </div>
        </div>

        <div className="flex-1 min-h-0">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto overflow-x-hidden overscroll-x-none [touch-action:pan-y] pt-20 pb-24 scroll-smooth custom-scrollbar theme-transition"
          >
            <div className="px-5 md:px-6 py-6">
              <div ref={chatContainerRef} className="space-y-6 theme-transition">
                {messages.map((msg, i) => (
                  <div 
                    key={i}
                    data-chat-row
                    className={cn(
                      "flex gap-4 items-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300 theme-transition",
                      msg.role === "user" ? "flex-row-reverse justify-start" : "justify-start"
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
                      "p-4 rounded-2xl text-sm leading-relaxed shadow-sm theme-transition max-w-[78%] md:max-w-[66%] break-words",
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
                <div className="mt-6 flex gap-4 items-start w-full">
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
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-border/50 glass-footer [--glass-alpha:0.9] [--glass-blur:32px] p-4 md:p-5">
          <form onSubmit={onSubmit} className="relative theme-transition">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Habla con Michito..."
              className="w-full bg-transparent border border-border rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-orange-500 transition-colors text-base md:text-sm text-foreground placeholder:text-muted-foreground theme-transition"
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
    </section>
  );
}
