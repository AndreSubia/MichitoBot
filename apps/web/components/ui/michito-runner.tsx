"use client";

import { RefObject, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./michito-runner.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type MichitoRunnerProps = {
  scrollerRef: RefObject<HTMLDivElement | null>;
};

export function MichitoRunner({ scrollerRef }: MichitoRunnerProps) {
  const michitoWrapRef = useRef<HTMLDivElement>(null);
  const michitoInnerRef = useRef<HTMLDivElement>(null);
  const yarnWrapRef = useRef<HTMLDivElement>(null);
  const yarnBallRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let rafId = 0;
    let cleanup: (() => void) | undefined;

    const init = () => {
      const scroller = scrollerRef.current;
      const michitoWrap = michitoWrapRef.current;
      const michitoInner = michitoInnerRef.current;
      const yarnWrap = yarnWrapRef.current;
      const yarnBall = yarnBallRef.current;
      if (!scroller || !michitoWrap) {
        rafId = window.requestAnimationFrame(init);
        return;
      }

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([michitoWrap, yarnWrap].filter(Boolean), { autoAlpha: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const ctx = gsap.context(() => {
          const clamp = (min: number, max: number, value: number) => Math.min(max, Math.max(min, value));
          const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
          const q = gsap.utils.selector(michitoWrap);

          const targets = Array.from(
            scroller.querySelectorAll<HTMLElement>(
              "[data-hero], [data-feature-card], [data-showcase-reveal], [data-control-card], [data-chat-shell]"
            )
          );
          if (!targets.length) return;

          gsap.set(michitoWrap, { x: 0, y: 0, autoAlpha: 1 });
          if (michitoInner) gsap.set(michitoInner, { scaleX: 1, rotation: 0, transformOrigin: "50% 50%" });
          if (yarnWrap) gsap.set(yarnWrap, { x: 0, y: 0, autoAlpha: 1 });
          if (yarnBall) gsap.set(yarnBall, { rotation: 0, transformOrigin: "50% 50%" });

          const runCycle = gsap.timeline({
            repeat: -1,
            yoyo: true,
            defaults: { duration: 0.3, ease: "sine.inOut" }
          });

          runCycle.to(q(`.${styles["michito__torso"]}`), { y: 10, rotation: 2 }, 0);
          runCycle.to(q(`.${styles["michito__leg--front-left"]}`), { rotation: 40 }, 0);
          runCycle.to(q(`.${styles["michito__leg--front-right"]}`), { rotation: -40 }, 0);
          runCycle.to(q(`.${styles["michito__leg--back-left"]}`), { rotation: -40 }, 0);
          runCycle.to(q(`.${styles["michito__leg--back-right"]}`), { rotation: 40 }, 0);
          runCycle.to(q(`.${styles["michito__tail"]}`), { rotation: -20 }, 0);
          runCycle.pause(0);

          const michitoXTo = gsap.quickTo(michitoWrap, "x", { duration: 0.55, ease: "power3.out" });
          const michitoYTo = gsap.quickTo(michitoWrap, "y", { duration: 0.55, ease: "power3.out" });
          const yarnXTo = yarnWrap ? gsap.quickTo(yarnWrap, "x", { duration: 0.55, ease: "power3.out" }) : undefined;
          const yarnYTo = yarnWrap ? gsap.quickTo(yarnWrap, "y", { duration: 0.55, ease: "power3.out" }) : undefined;
          const yarnRotTo = yarnBall ? gsap.quickTo(yarnBall, "rotation", { duration: 0.9, ease: "power2.out" }) : undefined;
          const tiltTo = michitoInner ? gsap.quickTo(michitoInner, "rotation", { duration: 0.55, ease: "power3.out" }) : undefined;

          const pad = 10;
          const edgeGap = 6;
          const safeTop = 84;
          const safeBottom = 140;
          const lead = window.matchMedia("(min-width: 768px)").matches ? 52 : 44;
          let lastX = 0;

          const positionOnEdge = (el: HTMLElement, progress: number, direction: 1 | -1) => {
            const rect = el.getBoundingClientRect();

            const michitoRect = michitoWrap.getBoundingClientRect();
            const michitoW = michitoRect.width || 140;
            const michitoH = michitoRect.height || 90;
            const yarnRect = yarnWrap?.getBoundingClientRect();
            const yarnW = yarnRect?.width || 22;
            const yarnH = yarnRect?.height || 22;

            const fromLeft = el.dataset.slideFrom === "left";
            const forwardRight = fromLeft;
            const movingRight = direction === 1 ? forwardRight : !forwardRight;

            const viewMaxX = Math.max(pad, window.innerWidth - michitoW - pad);
            const edgeMin = clamp(pad, viewMaxX, rect.left);
            const edgeMax = clamp(pad, viewMaxX, rect.right - michitoW);
            const minX = Math.min(edgeMin, edgeMax);
            const maxX = Math.max(edgeMin, edgeMax);

            const x = fromLeft ? lerp(minX, maxX, progress) : lerp(maxX, minX, progress);

            const yTop = rect.top - michitoH - edgeGap;
            const yBottom = rect.bottom + edgeGap;
            const yPreferred = yTop >= safeTop ? yTop : yBottom;
            const y = clamp(safeTop, Math.max(safeTop, window.innerHeight - michitoH - safeBottom), yPreferred);

            michitoXTo(x);
            michitoYTo(y);

            const yarnMaxX = Math.max(pad, window.innerWidth - yarnW - pad);
            const yarnX = clamp(pad, yarnMaxX, x + (movingRight ? lead : -lead));
            const yarnY = clamp(
              safeTop,
              Math.max(safeTop, window.innerHeight - yarnH - safeBottom),
              y + michitoH * 0.6 - yarnH * 0.5
            );
            if (yarnXTo) yarnXTo(yarnX);
            if (yarnYTo) yarnYTo(yarnY);
            if (yarnRotTo) yarnRotTo((progress + (movingRight ? 0 : 1)) * 1080);

            const dx = x - lastX;
            lastX = x;
            if (tiltTo) tiltTo(clamp(-10, 10, dx / 12));
            if (michitoInner) gsap.set(michitoInner, { scaleX: movingRight ? 1 : -1 });
          };

          const triggers = targets.map((el) =>
            ScrollTrigger.create({
              trigger: el,
              scroller,
              start: "top 86%",
              end: "top 58%",
              scrub: true,
              onEnter: () => runCycle.play(),
              onLeave: () => runCycle.pause(),
              onEnterBack: () => runCycle.play(),
              onLeaveBack: () => runCycle.pause(),
              onUpdate: (self) => {
                positionOnEdge(el, self.progress, self.direction === -1 ? -1 : 1);
              }
            })
          );

          positionOnEdge(targets[0], 0, 1);
          ScrollTrigger.refresh();

          return () => {
            triggers.forEach((t) => t.kill());
            runCycle.kill();
          };
        }, michitoWrap);

        return () => ctx.revert();
      });

      cleanup = () => {
        mm.revert();
      };

      return () => {
        cleanup?.();
      };
    };

    init();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      cleanup?.();
    };
  }, [scrollerRef]);

  return (
    <>
      <div ref={yarnWrapRef} className={styles.floatingYarn} aria-hidden="true">
        <div ref={yarnBallRef} className={styles["michito-yarn"]} />
      </div>

      <div ref={michitoWrapRef} className={styles.floatingCat} aria-hidden="true">
        <div className={styles["michito-wrapper"]}>
          <div ref={michitoInnerRef} className={styles.michito}>
            <div className={styles["michito__torso"]}>
              <div className={styles["michito__head"]}>
                <div className={`${styles["michito__ear"]} ${styles["michito__ear--left"]}`} />
                <div className={`${styles["michito__ear"]} ${styles["michito__ear--right"]}`} />
              </div>

              <div className={`${styles["michito__leg"]} ${styles["michito__leg--front-left"]}`} />
              <div className={`${styles["michito__leg"]} ${styles["michito__leg--front-right"]}`} />
              <div className={`${styles["michito__leg"]} ${styles["michito__leg--back-left"]}`} />
              <div className={`${styles["michito__leg"]} ${styles["michito__leg--back-right"]}`} />

              <div className={styles["michito__tail"]} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
