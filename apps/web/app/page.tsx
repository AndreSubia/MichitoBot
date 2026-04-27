"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registrar el plugin de GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Hooks
import { useChat } from "../hooks/use-chat";
import { useRules } from "../hooks/use-rules";

// Components
import { Sidebar } from "../components/sidebar/sidebar";
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
  const [showRulesModal, setShowRulesModal] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // Refs para animaciones
  const sunRefDesktop = useRef<HTMLDivElement>(null);
  const moonRefDesktop = useRef<HTMLDivElement>(null);
  const sunRefMobile = useRef<HTMLDivElement>(null);
  const moonRefMobile = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const avatarRefMobile = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

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

    // 2. Aparece la sidebar (desktop)
    if (sidebarRef.current) {
      const sidebar = sidebarRef.current;
      const children = Array.from(sidebar.children);
      
      gsap.set(children, { opacity: 0, x: -15 });

      // 2.1 Botón de invitación
      timeline.to(children[0], { 
        x: 0, 
        opacity: 1, 
        duration: 0.35, 
        ease: "power2.out" 
      }, "-=0.25");

      // 2.2 El resto (Estado y Reglas) en cascada rápida
      const remaining = children.slice(1);
      timeline.to(remaining, {
        x: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.05, // Cascada mucho más rápida
        ease: "power2.out",
        onComplete: () => {
          sidebar.classList.remove("gsap-reveal-stagger-init");
          gsap.set(children, { clearProps: "all" });
        }
      }, "-=0.2");
    }

    // 3. Aparece el área de chat (casi instantáneo)
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
        setTheme(nextTheme);
        setIsLoadingTheme(false);
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

  const handleCreateRuleWrapper = (e?: React.FormEvent) => {
    handleCreateRule(e);
    setShowRulesModal(false);
  };

  return (
    <div className="fixed inset-0 flex bg-background text-foreground font-sans overflow-hidden overscroll-none">
      <Sidebar 
        sidebarRef={sidebarRef}
        rules={rules}
        ruleInput={ruleInput}
        setRuleInput={setRuleInput}
        handleCreateRule={handleCreateRule}
        isCreatingRule={isCreatingRule}
        setShowInviteModal={setShowInviteModal}
      />

      <MobileHeader 
        headerRef={mobileHeaderRef}
        avatarRefMobile={avatarRefMobile}
        toggleTheme={toggleTheme}
        sunRef={sunRefMobile}
        moonRef={moonRefMobile}
        resolvedTheme={resolvedTheme}
        mounted={mounted}
        setShowRulesModal={setShowRulesModal}
        setShowInviteModal={setShowInviteModal}
      />

      <div ref={mainContentRef} className="flex-1 flex flex-col relative overflow-hidden h-full bg-background theme-transition">
        <ChatArea 
          messages={messages}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isLoading={isLoading}
          scrollRef={scrollRef}
          chatContainerRef={chatContainerRef}
        />
      </div>

      <Modals 
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
        showRulesModal={showRulesModal}
        setShowRulesModal={setShowRulesModal}
        rules={rules}
        ruleInput={ruleInput}
        setRuleInput={setRuleInput}
        handleCreateRule={handleCreateRuleWrapper}
        isCreatingRule={isCreatingRule}
      />
    </div>
  );
}
