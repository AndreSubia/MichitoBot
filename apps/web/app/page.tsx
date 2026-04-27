"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import gsap from "gsap";

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
  const avatarRef = useRef<HTMLDivElement>(null);
  const avatarRefMobile = useRef<HTMLDivElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const timeline = gsap.timeline({ delay: 0.1 });

    // 1. Aparece primero el header móvil o el contenido principal
    if (mobileHeaderRef.current) {
      timeline.fromTo(mobileHeaderRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
    }

    // 2. Aparece la sidebar (desktop)
    if (sidebarRef.current) {
      const sidebar = sidebarRef.current;
      const children = Array.from(sidebar.children);
      
      // Aseguramos que empiecen invisibles y movidos (por si acaso el CSS no carga a tiempo)
      gsap.set(children, { opacity: 0, x: -20 });

      // 2.1 Identidad (Avatar y Título) - SIEMPRE PRIMERO
      timeline.to(children[0], { 
        x: 0, 
        opacity: 1, 
        duration: 0.5, 
        ease: "power2.out" 
      }, "-=0.3");

      // 2.2 Banner de Discord
      timeline.to(children[1], { 
        x: 0, 
        opacity: 1, 
        duration: 0.5, 
        ease: "power2.out" 
      }, "-=0.3");

      // 2.3 El resto (Estado y Reglas) en cascada
      const remaining = children.slice(2);
      timeline.to(remaining, {
        x: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        onComplete: () => {
          sidebar.classList.remove("gsap-reveal-stagger-init");
          gsap.set(children, { clearProps: "all" });
        }
      }, "-=0.2");
    }

    // 3. Aparece el área de chat
    if (chatContainerRef.current) {
      timeline.fromTo(chatContainerRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, // Más rápido y directo
        "-=0.8" // Empieza mucho antes para que no se sienta lento
      );
    }

    // Animación de respiración del avatar
    const avatars = [avatarRef.current, avatarRefMobile.current].filter(Boolean);
    if (avatars.length > 0) {
      gsap.to(avatars, {
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
        avatarRef={avatarRef}
        rules={rules}
        ruleInput={ruleInput}
        setRuleInput={setRuleInput}
        handleCreateRule={handleCreateRule}
        isCreatingRule={isCreatingRule}
        toggleTheme={toggleTheme}
        sunRef={sunRefDesktop}
        moonRef={moonRefDesktop}
        resolvedTheme={resolvedTheme}
        mounted={mounted}
        setShowInviteModal={setShowInviteModal}
      />

      <div ref={mainContentRef} className="flex-1 flex flex-col relative overflow-hidden h-full bg-background theme-transition">
        <div ref={mobileHeaderRef}>
          <MobileHeader 
            avatarRefMobile={avatarRefMobile}
            toggleTheme={toggleTheme}
            sunRef={sunRefMobile}
            moonRef={moonRefMobile}
            resolvedTheme={resolvedTheme}
            mounted={mounted}
            setShowRulesModal={setShowRulesModal}
            setShowInviteModal={setShowInviteModal}
          />
        </div>

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
