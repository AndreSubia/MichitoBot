"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExternalLink, Plus, Settings, Sparkles, Zap, Layers, MessageSquare, Send } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

import { useChat } from "../hooks/use-chat";
import { useRules } from "../hooks/use-rules";
import { ChatArea } from "../components/chat/chat-area";
import { MobileHeader } from "../components/ui/mobile-header";
import { Modals } from "../components/ui/modals";

const FEATURES = [
  {
    icon: <Zap size={18} className="text-[#f43f8e]" />,
    label: "SIN CÓDIGO",
    title: "Entrena en lenguaje natural",
    desc: "Escribe una regla como si hablaras con alguien y Michito la adopta al instante. Sin prompts complejos, sin reentrenamientos.",
    iconBg: "from-[#f43f8e]/15 to-[#c084fc]/15",
    iconBorder: "border-[#f43f8e]/25",
    hoverBorder: "hover:border-[#f43f8e]/30",
    hoverShadow: "hover:shadow-[0_12px_36px_rgba(244,63,142,0.10)]",
  },
  {
    icon: <Layers size={18} className="text-[#c084fc]" />,
    label: "IA PRIVADA",
    title: "Tu modelo, tus datos",
    desc: "Corre sobre Ollama, completamente local. Sin datos enviados a terceros, sin costos de API y sin límites de peticiones.",
    iconBg: "from-[#c084fc]/15 to-[#818cf8]/15",
    iconBorder: "border-[#c084fc]/25",
    hoverBorder: "hover:border-[#c084fc]/30",
    hoverShadow: "hover:shadow-[0_12px_36px_rgba(192,132,252,0.10)]",
  },
  {
    icon: <MessageSquare size={18} className="text-[#818cf8]" />,
    label: "PERSONALIDAD ÚNICA",
    title: "Se siente de tu comunidad",
    desc: "Soporte técnico serio o moderador con humor: entrena la voz de tu servidor y Michito la mantiene en cada respuesta.",
    iconBg: "from-[#818cf8]/15 to-[#6366f1]/15",
    iconBorder: "border-[#818cf8]/25",
    hoverBorder: "hover:border-[#818cf8]/30",
    hoverShadow: "hover:shadow-[0_12px_36px_rgba(129,140,248,0.10)]",
  },
  {
    icon: <ExternalLink size={18} className="text-orange-400" />,
    label: "LISTO PARA DISCORD",
    title: "De cero a online en minutos",
    desc: "Un par de comandos, tus reglas y Michito ya está activo en tu servidor. Sin infraestructura ni configuración técnica.",
    iconBg: "from-orange-500/15 to-orange-400/10",
    iconBorder: "border-orange-500/25",
    hoverBorder: "hover:border-orange-400/30",
    hoverShadow: "hover:shadow-[0_12px_36px_rgba(251,146,60,0.10)]",
  },
];

const PILLS = ["🔒 IA privada", "⚡ Tiempo real", "🎭 Sin código"] as const;

export default function DemoPage() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    handleSend,
    scrollRef,
    chatContainerRef,
  } = useChat();

  const {
    rules,
    ruleInput,
    setRuleInput,
    isCreatingRule,
    handleCreateRule,
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

    if (resolvedTheme) {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", resolvedTheme === "dark" ? "#0b0e1c" : "#ffffff");
      }
    }

    const tl = gsap.timeline({
      delay: 0.05,
      onComplete: () => {
        document.querySelectorAll(".gsap-reveal-fade-init").forEach(el =>
          el.classList.remove("gsap-reveal-fade-init")
        );
        document.querySelectorAll(".gsap-reveal-stagger-init").forEach(el =>
          el.classList.remove("gsap-reveal-stagger-init")
        );
      },
    });

    if (mobileHeaderRef.current) {
      tl.fromTo(
        mobileHeaderRef.current,
        { y: -10, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.4, ease: "power2.out",
          onComplete: () => mobileHeaderRef.current?.classList.remove("gsap-reveal-fade-init"),
        }
      );
    }

    if (chatContainerRef.current) {
      tl.fromTo(
        chatContainerRef.current,
        { opacity: 0, y: 5 },
        {
          opacity: 1, y: 0, duration: 0.4, ease: "power2.out",
          onComplete: () => chatContainerRef.current?.classList.remove("gsap-reveal-fade-init"),
        },
        "-=0.6"
      );
    }

    if (avatarRefMobile.current) {
      gsap.to(avatarRefMobile.current, {
        y: -4, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
    }
  }, []);

  useEffect(() => {
    const scroller = pageScrollRef.current;
    if (!scroller) return;

    const updateGlass = () => {
      const t = Math.max(0, Math.min(1, scroller.scrollTop / 140));
      document.documentElement.style.setProperty("--glass-alpha", `${0.52 + t * 0.14}`);
      document.documentElement.style.setProperty("--glass-blur", `${10 + t * 6}px`);
    };

    updateGlass();
    scroller.addEventListener("scroll", updateGlass, { passive: true });
    return () => scroller.removeEventListener("scroll", updateGlass);
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
          return Math.min(320, Math.max(96, isDesktop ? vw * 0.22 : vw * 0.32));
        };

        const slideReveal = (elements: HTMLElement[], mode: "scrub" | "play" = "scrub") => {
          elements.forEach((el, idx) => {
            const centerX = window.innerWidth / 2;
            const rect = el.getBoundingClientRect();
            const elCenter = rect.left + rect.width / 2;
            const forced = el.dataset.slideFrom;
            const fromLeft =
              forced === "left" ? true
              : forced === "right" ? false
              : !isDesktop || Math.abs(elCenter - centerX) < 24 ? idx % 2 === 0
              : elCenter < centerX;
            el.dataset.slideFrom = fromLeft ? "left" : "right";

            gsap.fromTo(
              el,
              { autoAlpha: 0, x: () => (fromLeft ? -getDist() : getDist()), y: 10, force3D: true },
              {
                autoAlpha: 1, x: 0, y: 0,
                ease: mode === "scrub" ? "none" : "power3.out",
                duration: mode === "scrub" ? 1 : 0.9,
                scrollTrigger: mode === "scrub"
                  ? { trigger: el, scroller, start: "top 90%", end: "top 72%", scrub: true, invalidateOnRefresh: true }
                  : { trigger: el, scroller, start: "top 95%", toggleActions: "play none none reverse", invalidateOnRefresh: true },
              }
            );
          });
        };

        // ── Hero: separate title (big reveal) from subtitle (word cascade) ──
        const heroShell = scroller.querySelector<HTMLElement>("[data-hero]");
        if (heroShell) {
          const heroTitles = Array.from(heroShell.querySelectorAll<HTMLElement>("[data-hero-title]"));
          if (heroTitles.length) {
            gsap.set(heroTitles, { autoAlpha: 0 });
            gsap.fromTo(
              heroTitles,
              { autoAlpha: 0, y: 55, scale: 0.92, force3D: true },
              {
                autoAlpha: 1, y: 0, scale: 1,
                duration: 1.05,
                ease: "expo.out",
                stagger: { each: 0.1, from: "start" },
                scrollTrigger: {
                  trigger: heroShell, scroller,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                  invalidateOnRefresh: true,
                },
              }
            );
          }

          // Subtitle words: soft cascade with delay after title lands
          const heroWords = Array.from(heroShell.querySelectorAll<HTMLElement>("[data-hero-word]"));
          if (heroWords.length) {
            gsap.set(heroWords, { autoAlpha: 0 });
            gsap.fromTo(
              heroWords,
              { autoAlpha: 0, y: 10, force3D: true },
              {
                autoAlpha: 1, y: 0,
                duration: 0.5,
                ease: "power2.out",
                delay: 0.52,
                stagger: { each: 0.016, from: "start" },
                scrollTrigger: {
                  trigger: heroShell, scroller,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                  invalidateOnRefresh: true,
                },
              }
            );
          }
        }

        const showcaseItems = Array.from(scroller.querySelectorAll<HTMLElement>("[data-showcase-reveal]"));
        if (showcaseItems.length) slideReveal(showcaseItems);

        // ── Feature cards: staggered entrance, not scrub ──
        const featureCards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-feature-card]"));
        if (featureCards.length) {
          gsap.set(featureCards, { autoAlpha: 0, y: 32 });
          gsap.to(featureCards, {
            autoAlpha: 1, y: 0,
            duration: 0.65,
            ease: "power3.out",
            stagger: 0.09,
            scrollTrigger: {
              trigger: featureCards[0], scroller,
              start: "top 88%",
              toggleActions: "play none none reverse",
              invalidateOnRefresh: true,
            },
          });
        }

        const controlCards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-control-card]"));
        if (controlCards.length) slideReveal(controlCards, "play");

        // ── Hero parallax ──
        const hero = scroller.querySelector<HTMLElement>("[data-hero]");
        const heroBg = scroller.querySelector<HTMLElement>("[data-hero-bg]");
        if (hero && heroBg) {
          gsap.to(heroBg, {
            scale: 1.06, opacity: 0.25, ease: "none",
            scrollTrigger: { trigger: hero, scroller, start: "top 95%", end: "bottom 20%", scrub: true },
          });
          gsap.to(hero, {
            y: -10, ease: "none",
            scrollTrigger: { trigger: hero, scroller, start: "top 70%", end: "bottom 10%", scrub: true },
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

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", nextTheme === "dark" ? "#0b0e1c" : "#ffffff");
    }

    const suns = [sunRefDesktop.current, sunRefMobile.current].filter(Boolean);
    const moons = [moonRefDesktop.current, moonRefMobile.current].filter(Boolean);
    gsap.killTweensOf([...suns, ...moons]);

    const tl = gsap.timeline({
      onComplete: () => runViewTransition(() => { setTheme(nextTheme); setIsLoadingTheme(false); }),
    });

    if (isDark) {
      gsap.set(suns, { visibility: "visible" });
      tl.to(moons, { y: -40, opacity: 0, duration: 0.6, ease: "power3.inOut", onComplete: () => gsap.set(moons, { visibility: "hidden" }) });
      tl.fromTo(suns, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }, "-=0.4");
    } else {
      gsap.set(moons, { visibility: "visible" });
      tl.to(suns, { y: -40, opacity: 0, duration: 0.6, ease: "power3.inOut", onComplete: () => gsap.set(suns, { visibility: "hidden" }) });
      tl.fromTo(moons, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }, "-=0.4");
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

            {/* ── HERO ── */}
            <section className="w-full pt-0 md:pt-2">
              <div className="relative" data-hero>
                {/* Animated gradient blobs */}
                <div
                  className="pointer-events-none absolute -inset-x-10 -top-10 -bottom-6 opacity-90 blur-3xl animate-blob [background:radial-gradient(900px_circle_at_10%_20%,rgba(244,63,142,0.22),transparent_55%),radial-gradient(900px_circle_at_88%_28%,rgba(139,92,246,0.18),transparent_58%)]"
                  data-hero-bg
                />

                <div className="relative mx-auto w-full max-w-7xl px-2 md:px-0 py-5 md:py-9">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">

                    {/* ── Left: copy ── */}
                    <div className="md:col-span-7">
                      {/* Headline — uses data-hero-title for its own GSAP animation */}
                      <h2 className="mt-5 font-display font-extrabold tracking-tight leading-none">
                        <span
                          data-hero-title
                          className="inline-block hero-word-init text-5xl md:text-7xl bg-gradient-to-r from-[#f43f8e] via-[#c084fc] to-[#818cf8] bg-clip-text text-transparent"
                        >
                          Michito
                        </span>
                        {" "}
                        <span
                          data-hero-title
                          className="inline-block hero-word-init text-5xl md:text-7xl text-foreground"
                        >
                          Bot
                        </span>
                      </h2>

                      {/* Subtitle words — uses data-hero-word for staggered cascade */}
                      <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                        {"Dale una voz única a tu servidor de Discord. Entrena la personalidad de Michito con reglas en lenguaje natural y despliégalo en minutos, sin una línea de código."
                          .split(" ")
                          .map((word, idx, arr) => (
                            <span
                              key={`${word}-${idx}`}
                              data-hero-word
                              className={`inline-block hero-word-init ${idx < arr.length - 1 ? "mr-1" : ""}`}
                            >
                              {word}
                            </span>
                          ))}
                      </p>

                      {/* Feature pills */}
                      <div
                        className="mt-5 flex flex-wrap gap-2"
                        data-showcase-reveal
                        data-slide-from="left"
                      >
                        {PILLS.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center text-xs text-muted-foreground border border-border bg-muted/30 dark:bg-white/[0.04] px-3 py-1.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* CTAs */}
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => runViewTransition(() => setShowInviteModal(true))}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#f43f8e] to-[#a855f7] text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#f43f8e]/25"
                        >
                          <ExternalLink size={16} />
                          Invitar al servidor
                        </button>
                        <a
                          href="https://github.com/andre-subia/michito-bot"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-muted/50 dark:bg-white/[0.05] border border-border text-foreground font-semibold text-sm hover:bg-muted dark:hover:bg-white/[0.08] active:scale-95 transition-all"
                        >
                          <ExternalLink size={16} />
                          GitHub
                        </a>
                      </div>
                    </div>

                    {/* ── Right: avatar + chat preview composition ── */}
                    <div
                      className="md:col-span-5 hidden md:block"
                      data-showcase-reveal
                      data-slide-from="right"
                    >
                      <div className="relative select-none pointer-events-none pt-16" aria-hidden="true">

                        {/* Tilted bg cards — CSS float animations (transform set fully in keyframes) */}
                        <div className="absolute inset-6 rounded-2xl bg-white/[0.03] dark:bg-white/[0.03] border border-white/[0.07] animate-float-card-a" />
                        <div className="absolute inset-6 rounded-2xl bg-[#f43f8e]/[0.04] border border-[#f43f8e]/10 animate-float-card-b" />

                        {/* Main chat card */}
                        <div className="relative mx-6 rounded-2xl border border-black/[0.07] dark:border-white/[0.10] bg-white/85 dark:bg-white/[0.05] backdrop-blur-xl shadow-2xl shadow-black/20 p-5">

                          {/* Header */}
                          <div className="flex items-center gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#f43f8e] to-[#8b5cf6] overflow-hidden shrink-0">
                              <Image src="/avatar.png" alt="" fill className="object-cover p-0.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">Michito Bot</p>
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 shadow-sm shadow-emerald-400/60" />
                                <span className="text-[10px] text-muted-foreground">En línea · Discord</span>
                              </div>
                            </div>
                          </div>

                          {/* Messages */}
                          <div className="mt-3 space-y-2.5">
                            <div className="flex gap-2 items-end">
                              <div className="relative shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-[#f43f8e] to-[#8b5cf6] overflow-hidden">
                                <Image src="/avatar.png" alt="" fill className="object-cover" />
                              </div>
                              <div className="bg-black/[0.05] dark:bg-white/[0.07] rounded-xl rounded-bl-sm px-3 py-2 text-[12px] leading-snug max-w-[76%]">
                                ¡Hola! ¿En qué te puedo ayudar hoy? 👋
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <div className="bg-gradient-to-r from-[#f43f8e] to-[#a855f7] rounded-xl rounded-br-sm px-3 py-2 text-[12px] leading-snug text-white max-w-[76%]">
                                ¿Puedes ser más sarcástico?
                              </div>
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="relative shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-[#f43f8e] to-[#8b5cf6] overflow-hidden">
                                <Image src="/avatar.png" alt="" fill className="object-cover" />
                              </div>
                              <div className="bg-black/[0.05] dark:bg-white/[0.07] rounded-xl rounded-bl-sm px-3 py-2 text-[12px] leading-snug max-w-[76%]">
                                Ah claro, como si eso fuera <em>tan</em> difícil de aprender... 😏
                              </div>
                            </div>
                          </div>

                          {/* Input row */}
                          <div className="mt-3 flex gap-2 items-center bg-black/[0.04] dark:bg-white/[0.06] rounded-xl px-3 py-2">
                            <span className="text-[11px] text-muted-foreground flex-1">Escribe un mensaje...</span>
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-[#f43f8e] to-[#a855f7] flex items-center justify-center shrink-0">
                              <Send size={10} className="text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Floating pill */}
                        <div className="absolute top-[58px] right-1 z-40 rounded-full bg-gradient-to-r from-[#f43f8e] to-[#a855f7] px-3 py-1 text-[11px] text-white font-semibold shadow-lg shadow-[#f43f8e]/30">
                          ✦ Personalizable
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="w-full">
              <div className="mx-auto w-full max-w-7xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {FEATURES.map((f, i) => (
                    <div
                      key={i}
                      className={`group rounded-2xl border border-border bg-muted/20 dark:bg-white/[0.02] p-6 ${f.hoverBorder} ${f.hoverShadow} hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-default`}
                      data-feature-card
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.iconBg} border ${f.iconBorder} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        {f.icon}
                      </div>
                      <div className="text-[11px] font-semibold text-muted-foreground tracking-widest mb-2">
                        {f.label}
                      </div>
                      <div className="text-base font-display font-bold tracking-tight mb-2">
                        {f.title}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {f.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── TRAINING + CHAT ── */}
            <section className="w-full">
              <div className="mx-auto w-full max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start md:items-end">

                  {/* Training panel */}
                  <div className="md:col-span-4 sticky-desktop">
                    <div
                      className="rounded-3xl border border-border bg-background/60 glass-header p-6 md:p-7"
                      data-control-card
                      data-slide-from="left"
                    >
                      <div>
                        <div className="text-[11px] font-semibold text-muted-foreground tracking-widest">PANEL</div>
                        <div className="mt-2 text-xl md:text-2xl font-display font-bold tracking-tight">
                          Entrena a Michito
                        </div>
                        <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                          Añade reglas, cambia el tono y ajusta la personalidad en tiempo real. Los cambios aplican de inmediato, sin reiniciar nada.
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-4">
                        {/* Model status */}
                        <div className="rounded-2xl border border-border bg-muted/30 p-5">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                            <Settings size={16} className="text-[#c084fc]" />
                            <span>Estado del modelo</span>
                          </div>
                          <div className="mt-4 bg-background/50 border border-border rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Personalidad</span>
                              <span className="bg-gradient-to-r from-[#f43f8e] to-[#a855f7] bg-clip-text text-transparent font-semibold font-mono">
                                Dinámica
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Reglas activas</span>
                              <span className="text-emerald-500 dark:text-emerald-400 font-mono">{rules.length}</span>
                            </div>
                          </div>
                        </div>

                        {/* Rules */}
                        <div className="rounded-2xl border border-border bg-muted/30 p-5">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                            <Sparkles size={16} className="text-[#c084fc]" />
                            <span>Reglas de entrenamiento</span>
                          </div>

                          <form onSubmit={handleCreateRule} className="relative mt-4">
                            <input
                              type="text"
                              value={ruleInput}
                              onChange={(e) => setRuleInput(e.target.value)}
                              placeholder="Nueva regla (ej: sé sarcástico)"
                              className="w-full bg-background/60 border border-border rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#f43f8e]/40 text-foreground placeholder:text-muted-foreground theme-transition"
                            />
                            <button
                              type="submit"
                              disabled={isCreatingRule || !ruleInput.trim()}
                              className="absolute right-2 top-2 bottom-2 px-3 bg-gradient-to-r from-[#f43f8e] to-[#a855f7] hover:opacity-90 disabled:opacity-50 rounded-xl text-white transition-opacity"
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
                                  className="p-4 rounded-2xl bg-background/50 border border-border text-sm text-foreground leading-relaxed hover:border-[#f43f8e]/30 transition-colors"
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

                  {/* Chat */}
                  <div
                    className="md:col-span-8 h-[min(58vh,700px)] md:h-[min(66vh,760px)]"
                    data-control-card
                    data-slide-from="right"
                  >
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

      <Modals showInviteModal={showInviteModal} setShowInviteModal={setShowInviteModal} />
    </div>
  );
}
