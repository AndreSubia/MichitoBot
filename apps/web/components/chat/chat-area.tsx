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
  className,
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
                toggleActions: "play none none reverse",
              },
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
          "relative rounded-2xl border border-border dark:border-white/[0.10] bg-card/90 dark:bg-white/[0.04] backdrop-blur-xl overflow-hidden flex flex-col h-full shadow-xl dark:shadow-black/40",
          className
        )}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 border-b border-border/60 dark:border-white/[0.08] glass-header [--glass-alpha:0.92] [--glass-blur:28px]">
          <div className="px-5 md:px-6 py-3.5 flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#f43f8e] to-[#8b5cf6] overflow-hidden shrink-0 shadow-md shadow-[#f43f8e]/20">
                <Image src="/avatar.png" alt="Michito" fill className="object-cover p-0.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-tight truncate">Michito Bot</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/60" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    En línea
                  </span>
                </div>
              </div>
            </div>
            {typeof rulesCount === "number" && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f43f8e]/25 bg-[#f43f8e]/10 px-3 py-1 text-[11px] text-[#f43f8e] dark:text-[#f9a8d4] font-medium shrink-0">
                <Sparkles size={12} />
                {rulesCount} reglas
              </div>
            )}
          </div>
        </div>

        {/* Scroll area */}
        <div className="flex-1 min-h-0">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto overflow-x-hidden overscroll-x-none [touch-action:pan-y] pt-[4.5rem] pb-24 scroll-smooth custom-scrollbar"
          >
            <div className="px-5 md:px-6 py-4">
              <div ref={chatContainerRef} className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    data-chat-row
                    className={cn(
                      "flex gap-3 items-end w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                      msg.role === "user" ? "flex-row-reverse" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-[#f43f8e] to-[#8b5cf6]"
                          : "bg-muted/60 dark:bg-white/[0.08] border border-border"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <div className="relative w-full h-full">
                          <Image src="/avatar.png" alt="Michito" fill className="object-cover" />
                        </div>
                      ) : (
                        <User size={14} className="text-muted-foreground" />
                      )}
                    </div>

                    <div
                      className={cn(
                        "px-4 py-3 text-sm leading-relaxed max-w-[76%] md:max-w-[68%] break-words",
                        msg.role === "assistant"
                          ? "bg-black/[0.05] dark:bg-white/[0.07] rounded-2xl rounded-bl-sm text-foreground"
                          : "bg-gradient-to-r from-[#f43f8e] to-[#a855f7] rounded-2xl rounded-br-sm text-white shadow-md shadow-[#f43f8e]/20"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {isLoading && (
                <div className="mt-4 flex gap-3 items-end">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f43f8e] to-[#8b5cf6] overflow-hidden shrink-0 animate-pulse">
                    <div className="relative w-full h-full">
                      <Image src="/avatar.png" alt="Michito" fill className="object-cover" />
                    </div>
                  </div>
                  <div className="bg-black/[0.05] dark:bg-white/[0.07] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-[#c084fc] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-[#c084fc] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-[#c084fc] rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input footer */}
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-border/60 dark:border-white/[0.08] glass-footer [--glass-alpha:0.92] [--glass-blur:28px] p-4 md:p-5">
          <form onSubmit={onSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Habla con Michito..."
              className="w-full bg-black/[0.04] dark:bg-white/[0.05] border border-border dark:border-white/[0.10] rounded-xl py-3.5 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-[#f43f8e]/40 focus:border-transparent transition-all text-base md:text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 bg-gradient-to-r from-[#f43f8e] to-[#a855f7] hover:opacity-90 disabled:opacity-40 rounded-lg transition-opacity flex items-center justify-center text-white z-30"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
