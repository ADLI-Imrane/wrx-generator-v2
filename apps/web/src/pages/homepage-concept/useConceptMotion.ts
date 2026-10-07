import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/** All scroll state and styles belong to this temporary route and are reverted on exit. */
export function useConceptMotion(
  root: RefObject<HTMLDivElement>,
  quiet: boolean,
) {
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const media = gsap.matchMedia();
    let disposed = false;
    document.documentElement.classList.add("wrx-concept-page");
    const oldTitle = document.title;
    document.title =
      window.location.pathname === "/homepage-concept"
        ? "WRX — Faites circuler vos idées · Concept"
        : "WRX — Faites circuler vos idées";

    if (!quiet)
      media.add(
        "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
        () => {
          const stage = node.querySelector<HTMLElement>(".hc-stage")!;
          const cinematic = node.querySelector<HTMLElement>(".hc-cinematic")!;
          const ctx = gsap.context(() => {
            let active = true;
            const orbit = node.querySelector<HTMLElement>(".hc-orbit")!;
            const card = node.querySelector<HTMLElement>(".hc-card-object")!;
            const link = node.querySelector<HTMLElement>(".hc-link-object")!;
            const qr = node.querySelector<HTMLElement>(".hc-qr-object")!;
            const copy = node.querySelector<HTMLElement>(".hc-scene-copy")!;
            const manifesto = node.querySelector<HTMLElement>(".hc-manifesto")!;
            const controlScene =
              node.querySelector<HTMLElement>(".hc-control-scene")!;
            const bridge =
              node.querySelector<SVGSVGElement>(".hc-route-bridge")!;
            // Measure the reading zone independently from transformed bounds. Font/viewport refreshes
            // recompute the card's landing position without baking in one monitor's dimensions.
            const cardY = () =>
              copy.offsetTop +
              copy.offsetHeight +
              34 -
              orbit.offsetTop -
              card.offsetTop;
            const cardX = () =>
              stage.clientWidth * 0.085 -
              orbit.offsetLeft +
              stage.clientWidth * 0.24 -
              card.offsetLeft;
            const linkX = () =>
              stage.clientWidth * 0.46 -
              orbit.offsetLeft +
              stage.clientWidth * 0.24 -
              link.offsetLeft;
            const linkY = () => {
              const qrBottom =
                orbit.offsetTop +
                qr.offsetTop -
                stage.clientHeight * 0.075 +
                qr.offsetHeight * 1.075;
              return (
                Math.max(stage.clientHeight * 0.7, qrBottom + 22) -
                orbit.offsetTop -
                link.offsetTop
              );
            };
            const lenis = new Lenis({
              lerp: 0.105,
              smoothWheel: true,
              syncTouch: false,
              anchors: true,
            });
            const tick = (time: number) => lenis.raf(time * 1000);
            const update = () => ScrollTrigger.update();
            const interruptWheel = (event: KeyboardEvent) => {
              if (
                [
                  "Home",
                  "End",
                  "PageUp",
                  "PageDown",
                  "ArrowUp",
                  "ArrowDown",
                  " ",
                ].includes(event.key)
              ) {
                // Let native keyboard navigation take over immediately from wheel inertia.
                // No preventDefault: focus, buttons and browser scrolling retain their behavior.
                lenis.scrollTo(window.scrollY, { immediate: true });
              }
            };
            lenis.on("scroll", update);
            gsap.ticker.add(tick);
            window.addEventListener("keydown", interruptWheel);
            const chartPath =
              node.querySelector<SVGPathElement>(".hc-chart-line");
            const chartObserver =
              node.querySelector<SVGCircleElement>(".hc-chart-observer");
            const chartLatest =
              node.querySelector<SVGCircleElement>(".hc-chart-latest");
            if (chartPath && chartObserver) {
              const pathLength = chartPath.getTotalLength();
              const signal = { distance: 0 };
              gsap.set(chartObserver, { autoAlpha: 1 });
              gsap.to(signal, {
                distance: pathLength,
                duration: 13,
                ease: "none",
                repeat: -1,
                onUpdate: () => {
                  const point = chartPath.getPointAtLength(signal.distance);
                  gsap.set(chartObserver, { x: point.x, y: point.y });
                },
              });
            }
            if (chartLatest) {
              gsap.to(chartLatest, {
                scale: 1.38,
                opacity: 0.62,
                duration: 2.8,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
              });
            }
            gsap.set(copy, { autoAlpha: 0, y: 34 });
            gsap.set(".hc-art-caption", { autoAlpha: 0 });
            gsap.set(manifesto, {
              autoAlpha: 0,
              scale: 1.06,
              z: -220,
              transformOrigin: "50% 50%",
            });
            gsap.set(controlScene, {
              autoAlpha: 0,
              scale: 1.08,
              z: -260,
              transformOrigin: "50% 50%",
            });
            gsap.set(bridge, {
              autoAlpha: 0,
              scale: 0.42,
              rotation: -8,
              transformOrigin: "72% 72%",
            });

            // One pinned camera timeline owns the opening, manifesto and control handoffs.
            // Gaps between labels are deliberate readable holds, not overlapping triggers.
            const timeline = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: cinematic,
                pin: true,
                start: "top top",
                end: () => `+=${Math.round(cinematic.clientHeight * 5.35)}`,
                scrub: 0.35,
                invalidateOnRefresh: true,
                anticipatePin: 1,
              },
            });

            timeline
              .addLabel("opening", 0)
              .to(".hc-hero-copy", { y: -85, autoAlpha: 0, duration: 0.52 }, 0)
              .to(".hc-hero-foot", { autoAlpha: 0, duration: 0.3 }, 0)
              .to(
                ".hc-wordmark",
                { xPercent: -13, opacity: 0.04, duration: 0.8 },
                0,
              )
              .to(
                ".hc-orbit",
                {
                  x: () => -stage.clientWidth * 0.24,
                  rotation: 0,
                  duration: 0.85,
                },
                0.08,
              )
              .to(
                ".hc-card-object",
                {
                  rotation: 0,
                  y: cardY,
                  x: cardX,
                  scale: 1.02,
                  duration: 0.82,
                },
                0.08,
              )
              .to(
                ".hc-qr-object",
                {
                  rotation: 0,
                  x: () => stage.clientWidth * 0.175,
                  y: () => -stage.clientHeight * 0.075,
                  scale: 1.15,
                  duration: 0.82,
                },
                0.1,
              )
              .to(
                ".hc-link-object",
                {
                  rotation: 0,
                  x: linkX,
                  y: linkY,
                  scale: 1.08,
                  duration: 0.82,
                },
                0.12,
              )
              .to(
                ".hc-press-plane",
                {
                  scaleX: 4.5,
                  scaleY: 0.014,
                  rotation: 0,
                  y: () => stage.clientHeight * 0.16,
                  opacity: 0.7,
                  duration: 0.82,
                },
                0.06,
              )
              .to(copy, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.58)
              .to(".hc-art-caption", { autoAlpha: 1, duration: 0.28 }, 0.82)
              .to(".hc-progress-fill", { scaleX: 1, duration: 1.1 }, 0)
              .addLabel("constellation-hold", 1.35)
              .addLabel("constellation-exit", 2.05)
              .to(
                copy,
                { autoAlpha: 0, y: -24, duration: 0.34 },
                "constellation-exit",
              )
              .to(
                ".hc-hero-copy, .hc-hero-foot, .hc-wordmark, .hc-stage-bottom",
                {
                  autoAlpha: 0,
                  duration: 0.34,
                },
                "constellation-exit",
              )
              .to(
                ".hc-card-object",
                {
                  x: () => -stage.clientWidth * 0.62,
                  y: () => -stage.clientHeight * 0.25,
                  z: -640,
                  rotation: -18,
                  rotationY: -24,
                  scale: 0.72,
                  autoAlpha: 0,
                  duration: 0.84,
                  ease: "power2.in",
                },
                "constellation-exit",
              )
              .to(
                ".hc-qr-object",
                {
                  x: () => stage.clientWidth * 0.78,
                  y: () => -stage.clientHeight * 0.43,
                  z: 520,
                  rotation: 24,
                  rotationY: 30,
                  scale: 0.68,
                  autoAlpha: 0,
                  duration: 0.76,
                  ease: "power2.in",
                },
                "constellation-exit",
              )
              .to(
                ".hc-link-object",
                {
                  x: () => stage.clientWidth * 0.34,
                  y: () => -stage.clientHeight * 0.35,
                  z: 180,
                  rotation: 5,
                  scaleX: 0.92,
                  scaleY: 0.12,
                  autoAlpha: 0,
                  duration: 0.72,
                  ease: "power2.in",
                },
                "constellation-exit",
              )
              .to(
                ".hc-press-plane",
                {
                  x: () => -stage.clientWidth * 0.35,
                  z: -900,
                  scaleX: 3.2,
                  scaleY: 0.02,
                  rotation: -7,
                  autoAlpha: 0,
                  duration: 0.78,
                  ease: "power2.in",
                },
                "constellation-exit",
              )
              .to(
                bridge,
                {
                  autoAlpha: 1,
                  scale: 1,
                  rotation: 0,
                  duration: 0.68,
                  ease: "power2.out",
                },
                "constellation-exit+=0.2",
              )
              .to(
                stage,
                { autoAlpha: 0, duration: 0.18 },
                "constellation-exit+=0.82",
              )
              .addLabel("manifesto-resolve", 3.05)
              .to(
                manifesto,
                {
                  autoAlpha: 1,
                  scale: 1,
                  z: 0,
                  duration: 0.58,
                  ease: "power2.out",
                },
                "manifesto-resolve",
              )
              .addLabel("manifesto-hold", 3.85)
              .addLabel("manifesto-exit", 4.45)
              .to(
                manifesto,
                {
                  autoAlpha: 0,
                  scale: 1.16,
                  z: 620,
                  y: -55,
                  duration: 0.72,
                  ease: "power2.in",
                },
                "manifesto-exit",
              )
              .to(
                bridge,
                {
                  scale: 0.18,
                  rotation: 92,
                  yPercent: -12,
                  duration: 0.68,
                  ease: "power2.inOut",
                },
                "manifesto-exit",
              )
              .addLabel("control-resolve", 5.22)
              .to(
                controlScene,
                {
                  autoAlpha: 1,
                  scale: 1,
                  z: 0,
                  duration: 0.58,
                  ease: "power2.out",
                },
                "control-resolve",
              )
              .to(
                bridge,
                { autoAlpha: 0, duration: 0.24 },
                "control-resolve+=0.28",
              )
              .addLabel("control-hold", 5.95);

            const refresh = () => {
              if (active) {
                lenis.resize();
                ScrollTrigger.refresh();
              }
            };
            document.fonts.ready.then(() => {
              if (!disposed) refresh();
            });
            // ScrollTrigger handles viewport resize; this covers image decode and changing content geometry.
            const images = Array.from(node.querySelectorAll("img"));
            images.forEach((image) => image.addEventListener("load", refresh));
            const visualViewport = window.visualViewport;
            visualViewport?.addEventListener("resize", refresh);
            return () => {
              active = false;
              images.forEach((image) =>
                image.removeEventListener("load", refresh),
              );
              visualViewport?.removeEventListener("resize", refresh);
              window.removeEventListener("keydown", interruptWheel);
              gsap.ticker.remove(tick);
              lenis.off("scroll", update);
              // Settle native-scroll state before destruction, so a pending velocity reset
              // cannot re-add Lenis classes after leaving this isolated route.
              lenis.stop();
              lenis.destroy();
            };
          }, node);
          return () => ctx.revert();
        },
      );

    return () => {
      disposed = true;
      media.revert();
      document.documentElement.classList.remove("wrx-concept-page");
      document.title = oldTitle;
    };
  }, [root, quiet]);
}
