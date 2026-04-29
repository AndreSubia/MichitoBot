"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExternalLink, Plus, Settings, Sparkles } from "lucide-react";

// Registrar el plugin de GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Hooks
import { useChat } from "../hooks/use-chat";
import { useRules } from "../hooks/use-rules";

// Components
import { ChatArea } from "../components/chat/chat-area";
import { MobileHeader } from "../components/ui/mobile-header";
import { Modals } from "../components/ui/modals";

export default function DemoPage() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    handleSend,
    scrollRef,
    chatContainerRef
  } = useChat();

  const {
    rules,
    ruleInput,
    setRuleInput,
    isCreatingRule,
    handleCreateRule
  } = useRules();

  const [mounted, setMounted] = useState(false);
  const [isLoadingTheme, setIsLoadingTheme] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  const runViewTransition = (fn: () => void) => {
    const doc = document as unknown as { startViewTransition?: (cb: () => void) => unknown };
    const startViewTransition = doc.startViewTransition;
    if (typeof startViewTransition === "function") {
      try {
        (startViewTransition as unknown as (this: typeof doc, cb: () => void) => unknown).call(doc, fn);
      } catch {
        fn();
      }
      return;
    }
    fn();
  };

  // Refs para animaciones
  const sunRefDesktop = useRef<HTMLDivElement>(null);
  const moonRefDesktop = useRef<HTMLDivElement>(null);
  const sunRefMobile = useRef<HTMLDivElement>(null);
  const moonRefMobile = useRef<HTMLDivElement>(null);
  const avatarRefMobile = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Sincronizar theme-color inicial
    if (resolvedTheme) {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", resolvedTheme === "dark" ? "#09090b" : "#ffffff");
      }
    }

    const timeline = gsap.timeline({
      delay: 0.05,
      onComplete: () => {
        // Fallback de seguridad: eliminar todas las clases de inicialización
        document.querySelectorAll(".gsap-reveal-fade-init").forEach(el => {
          el.classList.remove("gsap-reveal-fade-init");
        });
        document.querySelectorAll(".gsap-reveal-stagger-init").forEach(el => {
          el.classList.remove("gsap-reveal-stagger-init");
        });
      }
    });

    // 1. Aparece primero el header móvil o el contenido principal
    if (mobileHeaderRef.current) {
      timeline.fromTo(mobileHeaderRef.current,
        { y: -10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4, // Más rápido
          ease: "power2.out",
          onComplete: () => {
            mobileHeaderRef.current?.classList.remove("gsap-reveal-fade-init");
          }
        }
      );
    }

    // 2. Aparece el área de chat (casi instantáneo)
    if (chatContainerRef.current) {
      timeline.fromTo(chatContainerRef.current,
        { opacity: 0, y: 5 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          onComplete: () => {
            chatContainerRef.current?.classList.remove("gsap-reveal-fade-init");
          }
        },
        "-=0.6" // Gran solapamiento para que aparezca rápido
      );
    }

    // Animación de respiración del avatar
    if (avatarRefMobile.current) {
      gsap.to(avatarRefMobile.current, {
        y: -4,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, []);

  useEffect(() => {
    const scroller = pageScrollRef.current;
    if (!scroller) return;

    const updateGlass = () => {
      const t = Math.max(0, Math.min(1, scroller.scrollTop / 140));
      const alpha = 0.52 + t * 0.14;
      const blur = 10 + t * 6;

      document.documentElement.style.setProperty("--glass-alpha", `${alpha}`);
      document.documentElement.style.setProperty("--glass-blur", `${blur}px`);
    };

    updateGlass();
    scroller.addEventListener("scroll", updateGlass, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", updateGlass);
    };
  }, []);

  useLayoutEffect(() => {
    const scroller = pageScrollRef.current;
    if (!scroller) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: reduce)", () => {});
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const isDesktop = window.matchMedia("(min-width: 768px)").matches;
        const getDist = () => {
          const vw = window.innerWidth;
          const preferred = isDesktop ? vw * 0.22 : vw * 0.32;
          return Math.min(320, Math.max(96, preferred));
        };

        const slideReveal = (elements: HTMLElement[], mode: "scrub" | "play" = "scrub") => {
          elements.forEach((el, idx) => {
            const centerX = window.innerWidth / 2;
            const rect = el.getBoundingClientRect();
            const elCenter = rect.left + rect.width / 2;
            const isCentered = Math.abs(elCenter - centerX) < 24;
            const forced = el.dataset.slideFrom;
            const fromLeft =
              forced === "left" ? true : forced === "right" ? false : !isDesktop || isCentered ? idx % 2 === 0 : elCenter < centerX;
            el.dataset.slideFrom = fromLeft ? "left" : "right";

            gsap.fromTo(
              el,
              { autoAlpha: 0, x: () => (fromLeft ? -getDist() : getDist()), y: 10, force3D: true },
              {
                autoAlpha: 1,
                x: 0,
                y: 0,
                ease: mode === "scrub" ? "none" : "power3.out",
                duration: mode === "scrub" ? 1 : 0.9,
                scrollTrigger:
                  mode === "scrub"
                    ? {
                        trigger: el,
                        scroller,
                        start: "top 90%",
                        end: "top 72%",
                        scrub: true,
                        invalidateOnRefresh: true
                      }
                    : {
                        trigger: el,
                        scroller,
                        start: "top 95%",
                        toggleActions: "play none none reverse",
                        invalidateOnRefresh: true
                      }
              }
            );
          });
        };

        const heroShell = scroller.querySelector<HTMLElement>("[data-hero]");
        if (heroShell) {
          const heroWords = Array.from(heroShell.querySelectorAll<HTMLElement>("[data-hero-word]"));
          if (heroWords.length) {
            gsap.set(heroWords, { autoAlpha: 0 });
            gsap.fromTo(
              heroWords,
              {
                autoAlpha: 0,
                y: 14,
                x: (idx) => (idx % 2 === 0 ? -getDist() * 0.22 : getDist() * 0.22),
                rotation: (idx) => (idx % 2 === 0 ? -7 : 7),
                scale: 0.98,
                force3D: true
              },
              {
                autoAlpha: 1,
                y: 0,
                x: 0,
                rotation: 0,
                scale: 1,
                duration: 1.15,
                ease: "power3.out",
                stagger: { each: 0.05, from: "start" },
                scrollTrigger: {
                  trigger: heroShell,
                  scroller,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                  invalidateOnRefresh: true
                }
              }
            );
          }
        }

        const showcaseItems = Array.from(
          scroller.querySelectorAll<HTMLElement>("[data-showcase-reveal]")
        );
        if (showcaseItems.length) slideReveal(showcaseItems);

        const featureCards = Array.from(
          scroller.querySelectorAll<HTMLElement>("[data-feature-card]")
        );
        if (featureCards.length) {
          slideReveal(featureCards);
          featureCards.forEach((card) => {
            gsap.fromTo(
              card,
              { scale: 0.985 },
              {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  scroller,
                  start: "top 90%",
                  end: () => `+=${Math.min(260, Math.round(window.innerHeight * 0.32))}`,
                  scrub: true
                }
              }
            );
          });
        }

        const controlCards = Array.from(
          scroller.querySelectorAll<HTMLElement>("[data-control-card]")
        );
        if (controlCards.length) slideReveal(controlCards, "play");

        const hero = scroller.querySelector<HTMLElement>("[data-hero]");
        const heroBg = scroller.querySelector<HTMLElement>("[data-hero-bg]");
        if (hero && heroBg) {
          gsap.to(heroBg, {
            scale: 1.06,
            opacity: 0.25,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              scroller,
              start: "top 95%",
              end: "bottom 20%",
              scrub: true
            }
          });

          gsap.to(hero, {
            y: -10,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              scroller,
              start: "top 70%",
              end: "bottom 10%",
              scrub: true
            }
          });
        }

        ScrollTrigger.refresh();
      }, scroller);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  const toggleTheme = () => {
    if (isLoadingTheme) return;
    setIsLoadingTheme(true);

    const isDark = resolvedTheme === "dark";
    const nextTheme = isDark ? "light" : "dark";

    // Actualizar meta tag theme-color para móviles
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", nextTheme === "dark" ? "#09090b" : "#ffffff");
    }

    const suns = [sunRefDesktop.current, sunRefMobile.current].filter(Boolean);
    const moons = [moonRefDesktop.current, moonRefMobile.current].filter(Boolean);

    gsap.killTweensOf([...suns, ...moons]);

    const timeline = gsap.timeline({
      onComplete: () => {
        runViewTransition(() => {
          setTheme(nextTheme);
          setIsLoadingTheme(false);
        });
      }
    });

    if (isDark) {
      gsap.set(suns, { visibility: "visible" });
      timeline.to(moons, {
        y: -40,
        opacity: 0,
        duration: 0.6,
        ease: "power3.inOut",
        onComplete: () => gsap.set(moons, { visibility: "hidden" })
      });
      timeline.fromTo(suns,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.4"
      );
    } else {
      gsap.set(moons, { visibility: "visible" });
      timeline.to(suns, {
        y: -40,
        opacity: 0,
        duration: 0.6,
        ease: "power3.inOut",
        onComplete: () => gsap.set(suns, { visibility: "hidden" })
      });
      timeline.fromTo(moons,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.4"
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-background text-foreground font-sans overflow-hidden overscroll-none">
      <MobileHeader
        headerRef={mobileHeaderRef}
        avatarRefMobile={avatarRefMobile}
        toggleTheme={toggleTheme}
        sunRef={sunRefMobile}
        moonRef={moonRefMobile}
        resolvedTheme={resolvedTheme}
        mounted={mounted}
      />

      <div ref={mainContentRef} className="h-full relative overflow-hidden bg-background theme-transition">
        <div
          ref={pageScrollRef}
          className="h-full overflow-y-auto overflow-x-hidden overscroll-x-none [touch-action:pan-y] p-4 md:p-8 pt-[calc(6rem+env(safe-area-inset-top))] md:pt-28 pb-6 md:pb-8 space-y-6 scroll-smooth custom-scrollbar theme-transition"
        >
          <div className="space-y-10 md:space-y-14">
            <section className="w-full pt-0 md:pt-2">
              <div className="relative" data-hero>
                <div
                  className="pointer-events-none absolute -inset-x-10 -top-10 -bottom-6 opacity-80 blur-2xl [background:radial-gradient(900px_circle_at_0%_12%,rgba(249,115,22,0.18),transparent_58%),radial-gradient(900px_circle_at_100%_34%,hsl(var(--primary)/0.12),transparent_60%)]"
                  data-hero-bg
                />
                <div className="relative mx-auto w-full max-w-7xl px-2 md:px-0 py-5 md:py-9">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
                    <div className="md:col-span-7">
                      <div
                        className="inline-flex items-center gap-2 self-start"
                        data-showcase-reveal
                        data-slide-from="left"
                      >
                        <a
                          href="https://github.com/andre-subia/michito-bot"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex"
                          aria-label="Ver repositorio en GitHub"
                        >
                          <img
                            alt="Discord.js"
                            src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white"
                            className="h-7 w-auto rounded-md"
                          />
                        </a>
                        <a
                          href="https://github.com/andre-subia/michito-bot"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex"
                          aria-label="Ver repositorio en GitHub"
                        >
                          <img
                            alt="GitHub"
                            src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"
                            className="h-7 w-auto rounded-md dark:hidden"
                          />
                          <img
                            alt="GitHub"
                            src="https://img.shields.io/badge/GitHub-ffffff?style=for-the-badge&logo=github&logoColor=000000"
                            className="h-7 w-auto rounded-md hidden dark:block"
                          />
                        </a>
                      </div>

                      <h2 className="mt-4 text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                        {"Michito Bot".split(" ").map((word, idx, arr) => (
                          <span key={`${word}-${idx}`} data-hero-word className="inline-block hero-word-init">
                            {word}
                            {idx < arr.length - 1 ? "\u00A0" : ""}
                          </span>
                        ))}
                      </h2>
                      <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        {"Entrena una personalidad en minutos con reglas simples y conversa en una interfaz fluida. Diseñado para sentirse rápido, humano y con scroll inmersivo."
                          .split(" ")
                          .map((word, idx, arr) => (
                            <span key={`${word}-${idx}`} data-hero-word className="inline-block hero-word-init">
                              {word}
                              {idx < arr.length - 1 ? "\u00A0" : ""}
                            </span>
                          ))}
                      </p>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => runViewTransition(() => setShowInviteModal(true))}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
                        >
                          <ExternalLink size={16} />
                          Invitar
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-5" data-showcase-reveal data-slide-from="right">
                      <div className="relative mx-auto w-full max-w-[520px]">
                        <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-70 blur-xl [background:radial-gradient(520px_circle_at_40%_30%,rgba(249,115,22,0.22),transparent_60%)]" />
                        <div className="relative overflow-hidden rounded-[2.25rem] bg-transparent">
                          <div className="relative aspect-[4/3] md:aspect-[3/4]">
                            <Image src="/avatar.png" alt="Michito" fill className="object-cover" priority />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="w-full">
              <div className="mx-auto w-full max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 rounded-3xl border border-border bg-muted/30 p-6 md:p-8" data-showcase-reveal data-slide-from="left">
                    <div className="text-xs font-semibold text-muted-foreground tracking-wider">CÓMO FUNCIONA</div>
                    <div className="mt-2 text-xl font-bold tracking-tight">Define reglas, conversa, itera</div>
                    <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      Las reglas actúan como un estilo rápido: puedes activarlas o cambiarlas sin reiniciar la conversación.
                    </div>
                  </div>
                  <div className="md:col-span-8 rounded-3xl border border-border bg-muted/30 p-6 md:p-8" data-showcase-reveal data-slide-from="right">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border bg-background/50 p-5" data-feature-card data-slide-from="right">
                        <div className="text-xs font-semibold text-muted-foreground tracking-wider">EXPERIENCIA</div>
                        <div className="mt-2 text-base font-bold tracking-tight">Cristal que responde al scroll</div>
                        <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                          Header e input funcionan como vidrio: el contenido pasa por detrás con blur y opacidad dinámicos.
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border bg-background/50 p-5" data-feature-card data-slide-from="right">
                        <div className="text-xs font-semibold text-muted-foreground tracking-wider">CASOS DE USO</div>
                        <div className="mt-2 text-base font-bold tracking-tight">Soporte, comunidad, humor</div>
                        <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                          Responde FAQs, modera con estilo o dale una voz consistente a tu comunidad.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-7 rounded-3xl border border-border bg-muted/30 p-6 md:p-8" data-showcase-reveal data-slide-from="left">
                    <div className="text-xs font-semibold text-muted-foreground tracking-wider">CONTROL</div>
                    <div className="mt-2 text-xl font-bold tracking-tight">Rápido, editable, humano</div>
                    <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      Reglas activas visibles, cambios instantáneos y una interacción que se siente fluida desde el primer scroll.
                    </div>
                  </div>
                  <div className="md:col-span-5 rounded-3xl border border-border bg-muted/30 p-6 md:p-8" data-showcase-reveal data-slide-from="right">
                    <div className="text-xs font-semibold text-muted-foreground tracking-wider">INTEGRACIÓN</div>
                    <div className="mt-2 text-xl font-bold tracking-tight">Llévalo a Discord</div>
                    <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      Invítalo cuando estés listo y mantén la personalidad consistente en el tiempo.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="w-full">
              <div className="mx-auto w-full max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start md:items-end">
                  <div className="md:col-span-4 sticky-desktop">
                    <div className="rounded-3xl border border-border bg-background/60 glass-header p-6 md:p-7" data-control-card data-slide-from="left">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground tracking-wider">PANEL</div>
                          <div className="mt-2 text-xl md:text-2xl font-bold tracking-tight">Entrena a Michito</div>
                          <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            Ajusta reglas y estado del modelo sin romper el flujo del chat.
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-4">
                        <div className="rounded-2xl border border-border bg-muted/30 p-5">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                            <Settings size={16} />
                            <span>Estado del modelo</span>
                          </div>
                          <div className="mt-4 bg-background/50 border border-border rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Personalidad</span>
                              <span className="text-orange-500 dark:text-orange-400 font-mono">Dinámica</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Reglas activas</span>
                              <span className="text-emerald-500 dark:text-emerald-400 font-mono">{rules.length}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-muted/30 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                              <Sparkles size={16} />
                              <span>Reglas de entrenamiento</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Se aplican al instante
                            </div>
                          </div>

                          <form onSubmit={handleCreateRule} className="relative mt-4">
                            <input 
                              type="text"
                              value={ruleInput}
                              onChange={(e) => setRuleInput(e.target.value)}
                              placeholder="Nueva regla (ej: sé sarcástico)"
                              className="w-full bg-background/60 border border-border rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-foreground placeholder:text-muted-foreground theme-transition"
                            />
                            <button 
                              type="submit"
                              disabled={isCreatingRule || !ruleInput.trim()}
                              className="absolute right-2 top-2 bottom-2 px-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-xl text-white transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </form>

                          <div className="mt-4 grid grid-cols-1 gap-3">
                            {rules.length === 0 ? (
                              <div className="text-sm text-muted-foreground italic text-center py-8 bg-background/30 rounded-2xl border border-dashed border-border">
                                No hay reglas todavía. Crea la primera arriba.
                              </div>
                            ) : (
                              rules.map((rule) => (
                                <div 
                                  key={rule.id}
                                  className="p-4 rounded-2xl bg-background/50 border border-border text-sm text-foreground leading-relaxed hover:border-accent transition-colors"
                                >
                                  {rule.text}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-8 h-[min(58vh,700px)] md:h-[min(66vh,760px)]" data-control-card data-slide-from="right">
                    <ChatArea 
                      messages={messages}
                      input={input}
                      setInput={setInput}
                      onSubmit={handleSend}
                      isLoading={isLoading}
                      scrollRef={scrollRef}
                      chatContainerRef={chatContainerRef}
                      rulesCount={rules.length}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

      </div>

      <Modals
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
      />
    </div>
  );
}
