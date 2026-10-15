import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { BrandConstruction } from "../brand-hero/createBrandConstruction";
import "lenis/dist/lenis.css";
gsap.registerPlugin(ScrollTrigger);

/** One owned clock. No competing RAF or React scroll state. */
export function createCreativeMotion(
  root: HTMLElement,
  construction?: BrandConstruction,
  enabled = true,
) {
  const media = gsap.matchMedia();
  media.add(
    "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
    () => {
      if (!enabled) return;
      const stage = root.querySelector<HTMLElement>(".v4-journey-stage");
      const track = root.querySelector<HTMLElement>(".v4-journey-track");
      const journey = root.querySelector<HTMLElement>(".v4-journey");
      if (!stage || !track || !journey) return;
      ScrollTrigger.saveStyles(
        root.querySelectorAll(
          ".v4-link, .v4-physical-shell, .v4-public-shell, .v4-encoding, .v4-identity-word, .v4-travelling-signal, .v4-identity-parts, .v4-identity-parts > span, .v4-signature-output, .v4-card-lean, .v4-strike-head, .v4-strike-trail, .v4-strike-record, .v4-workspace-assembly > div, .v4-approach-path, .v4-depth-reference, .v4-release-path, .v4-entry-shell, .v4-hero-field i, .v4-hero-route, .v4-hero-object, .v4-arrival-path path, .v4-impact, .v4-release-signature, .v4-release-signature > *, .v4-release-mail-header, .v4-release-mail > p, .v4-email, .v4-release-mail, .v4-release-runway > span, .v4-journey-top",
        ),
      );
      const lenis = new Lenis({
        lerp: 0.16,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: false,
        anchors: true,
      });
      const update = () => ScrollTrigger.update();
      lenis.on("scroll", update);
      let ticking = false;
      let previous: number | undefined;
      let clock = 0;
      const tick = (time: number) => {
        clock +=
          previous === undefined ? 16 : Math.min(40, (time - previous) * 1000);
        previous = time;
        lenis.raf(clock);
        if (!lenis.isScrolling) {
          gsap.ticker.remove(tick);
          ticking = false;
          previous = undefined;
        }
      };
      const wake = () => {
        if (!ticking) {
          ticking = true;
          gsap.ticker.add(tick);
        }
      };
      window.addEventListener("wheel", wake, { passive: true });
      window.addEventListener("keydown", wake);
      const anchor = (event: MouseEvent) => {
        if ((event.target as Element).closest('a[href^="#"]')) wake();
      };
      root.addEventListener("click", anchor);
      const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth);
      const intro = root.querySelector<HTMLElement>(".v4-intro");
      const approachPath =
        root.querySelector<SVGPathElement>(".v4-approach-path");
      if (intro && approachPath) {
        gsap.fromTo(
          approachPath,
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: intro,
              start: "top 72%",
              end: "bottom 48%",
              scrub: true,
            },
          },
        );
      }
      const depthReference = root.querySelector<HTMLElement>(
        ".v4-depth-reference",
      );
      const releasePath =
        root.querySelector<SVGPathElement>(".v4-release-path");
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: journey,
          start: "top top",
          end: () => `+=${distance() + stage.clientWidth * 0.35}`,
          pin: stage,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      timeline
        .to(
          track,
          {
            x: () => -distance(),
            duration: 0.84,
            ease: (p: number) =>
              p <= 0.8 ? p / 0.9 : (p - (p - 0.8) ** 2 / 0.4) / 0.9,
          },
          0,
        )
        .to(depthReference, { x: () => -distance() * 0.16, duration: 0.84 }, 0)
        .fromTo(
          root.querySelector(".v4-progress span"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1 },
          0,
        )
        .fromTo(
          releasePath,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.24 },
          0.76,
        )
        .fromTo(
          root.querySelector(".v4-physical-shell"),
          {
            rotation: -14,
            rotationY: -12,
            x: 0,
            y: 25,
            scale: 1,
            transformOrigin: "center center",
          },
          {
            rotation: 2,
            rotationY: 0,
            x: () => stage.clientWidth * 0.24,
            y: 65,
            scale: 0.63,
            duration: 0.37,
          },
          0.63,
        );
      timeline
        .fromTo(
          root.querySelector(".v4-public-shell"),
          { x: 180, y: 80, rotation: 9, scale: 0.86 },
          { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.28 },
          0.72,
        )
        .to(
          root.querySelector(".v4-link"),
          { x: () => stage.clientWidth * 0.18, duration: 0.45 },
          0,
        )
        .to(root.querySelector(".v4-encoding"), { y: 45, duration: 0.6 }, 0)
        .to(
          root.querySelector(".v4-identity-word"),
          { x: -130, duration: 0.65 },
          0.35,
        )
        .to(
          root.querySelector(".v4-travelling-signal"),
          { x: () => stage.clientWidth * 1.25, duration: 0.65 },
          0,
        );
      const trigger = timeline.scrollTrigger!;
      // The routing surface already approaches diagonally before the pin.
      // The final vertical derivative cancels native upward travel at the seam;
      // the small continuing x offset eases into the track's lateral velocity.
      const entryShell = root.querySelector<HTMLElement>(".v4-entry-shell");
      if (entryShell) {
        const entryHeight = () => Math.min(window.innerHeight * 0.8, 760);
        gsap.fromTo(
          entryShell,
          { scale: 0.88, rotation: -2, transformOrigin: "18% 45%" },
          {
            scale: 1,
            rotation: 0,
            ease: "power1.out",
            scrollTrigger: {
              trigger: journey,
              start: () => `top bottom-=${window.innerHeight - entryHeight()}`,
              end: "top top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
        gsap.fromTo(
          entryShell,
          {
            x: () =>
              (entryHeight() * 0.5 * distance()) /
              (0.84 * 0.9 * (distance() + stage.clientWidth * 0.35)),
          },
          {
            x: 0,
            ease: "power1.in",
            scrollTrigger: {
              trigger: journey,
              start: () => `top bottom-=${window.innerHeight - entryHeight()}`,
              end: "top top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
        gsap.fromTo(
          [entryShell, root.querySelector(".v4-journey-top"), depthReference],
          { y: 0 },
          {
            y: () => -entryHeight() * 0.25,
            ease: (p: number) => 4 * p * (1 - p),
            scrollTrigger: {
              trigger: journey,
              start: () => `top bottom-=${window.innerHeight - entryHeight()}`,
              end: "top top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      }
      // The last lateral passage deposits the identity before the paper moves up.
      timeline.fromTo(
        root.querySelector(".v4-release-signature"),
        { y: -90, scale: 1.65, transformOrigin: "left center" },
        { y: 100, scale: 1, duration: 0.24, ease: "power1.inOut" },
        0.76,
      );
      timeline.fromTo(
        root.querySelector(".v4-release-signature > strong"),
        { x: -80 },
        { x: 0, duration: 0.2 },
        0.76,
      );
      timeline.fromTo(
        root.querySelector(".v4-release-signature > span"),
        { x: 95, y: 55 },
        { x: 0, y: 0, duration: 0.2 },
        0.76,
      );
      timeline.fromTo(
        root.querySelectorAll(".v4-release-mail-header, .v4-release-mail > p"),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.12 },
        0.88,
      );
      timeline.fromTo(
        root.querySelector(".v4-release-mail"),
        { "--mail-surface": 0 },
        { "--mail-surface": 1, duration: 0.12 },
        0.86,
      );
      timeline.fromTo(
        root.querySelectorAll(".v4-release-mail, .v4-release-runway > span"),
        { y: 0 },
        {
          y: () => -(distance() + stage.clientWidth * 0.35) * 0.08,
          duration: 0.16,
          ease: "power1.in",
        },
        0.84,
      );
      timeline.to(
        root.querySelector(".v4-journey-top"),
        { autoAlpha: 0, duration: 0.08 },
        0.88,
      );
      const moveTo = (stop: HTMLElement) => {
        const offset = Math.max(0, Math.min(distance(), stop.offsetLeft));
        const ratio = distance() ? offset / distance() : 0;
        const travelProgress =
          ratio <= 8 / 9 ? ratio * 0.9 : 1 - 0.6 * Math.sqrt(1 - ratio);
        const position =
          trigger.start + travelProgress * 0.84 * (trigger.end - trigger.start);
        lenis.scrollTo(position, { duration: 0.65 });
        wake();
      };
      const focus = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        const bounds = target.getBoundingClientRect();
        const stop = target.closest<HTMLElement>("[data-stop]");
        if (stop && (bounds.left < 0 || bounds.right > stage.clientWidth)) {
          if (target.closest(".v4-encoding")) {
            lenis.scrollTo(trigger.start + stage.clientWidth * 0.55, {
              duration: 0.45,
            });
            wake();
          } else moveTo(stop);
        }
      };
      track.addEventListener("focusin", focus);
      const buttons = Array.from(
        root.querySelectorAll<HTMLButtonElement>("[data-journey-go]"),
      );
      const callbacks = buttons.map((button) => {
        const callback = () => {
          const stop = track.querySelector<HTMLElement>(
            `[data-stop="${button.dataset["journeyGo"]}"]`,
          );
          if (stop) moveTo(stop);
        };
        button.addEventListener("click", callback);
        return callback;
      });
      const hero = root.querySelector<HTMLElement>(".v4-hero");
      let disposeField: (() => void) | undefined;
      if (hero) {
        const marks = Array.from(
          hero.querySelectorAll<HTMLElement>(".v4-hero-field i"),
        );
        const object = hero.querySelector<HTMLElement>(".v4-hero-object");
        const movers = marks.map((mark) => ({
          mark,
          x: gsap.quickTo(mark, "x", { duration: 0.35 }),
          y: gsap.quickTo(mark, "y", { duration: 0.35 }),
          rotate: gsap.quickTo(mark, "rotation", { duration: 0.4 }),
        }));
        const lean = object
          ? gsap.quickTo(object, "rotationY", {
              duration: 0.7,
              ease: "power3.out",
            })
          : undefined;
        let points: { x: number; y: number }[] = [];
        const enter = () => {
          points = marks.map((mark) => {
            const r = mark.getBoundingClientRect();
            return {
              x: r.x + r.width / 2,
              y: r.y + r.height / 2 + window.scrollY,
            };
          });
        };
        const leave = () => {
          movers.forEach(({ mark, x, y, rotate }) => {
            x(0);
            y(0);
            rotate(0);
            mark.style.removeProperty("--proximity");
          });
          lean?.(0);
        };
        const move = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return;
          movers.forEach(({ mark, x, y, rotate }, index) => {
            const point = points[index];
            if (!point) return;
            const dx = event.clientX - point.x,
              dy = event.clientY + window.scrollY - point.y;
            const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / 170);
            x(dx * proximity * 0.08);
            y(dy * proximity * 0.08);
            rotate(-32 * proximity);
            mark.style.setProperty("--proximity", String(proximity));
          });
          lean?.((event.clientX / window.innerWidth - 0.5) * 2.4);
        };
        hero.addEventListener("pointerenter", enter);
        hero.addEventListener("pointermove", move);
        hero.addEventListener("pointerleave", leave);
        gsap.fromTo(
          hero.querySelector(".v4-hero-route"),
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom 25%",
              scrub: true,
            },
          },
        );
        disposeField = () => {
          hero.removeEventListener("pointerenter", enter);
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerleave", leave);
          movers.forEach(({ x, y, rotate, mark }) => {
            x.tween.kill();
            y.tween.kill();
            rotate.tween.kill();
            mark.style.removeProperty("--proximity");
          });
          lean?.tween.kill();
        };
      }
      if (hero && construction)
        ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          end: "bottom top",
          onUpdate: (self) =>
            construction.setRelease(
              Math.min(1, self.progress * 2),
              Math.min(1, self.progress * 2.5),
            ),
        });
      gsap.fromTo(
        root.querySelector(".v4-intro em"),
        { y: 50 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.querySelector(".v4-intro"),
            start: "top 90%",
            end: "center center",
            scrub: true,
          },
        },
      );
      // Local assembly: the visible identity fragments land on the actual copied output.
      // Geometry is read only during initialization/refresh, never on scroll ticks.
      const signature = root.querySelector<HTMLElement>(".v4-signature");
      if (signature) {
        const assembly = gsap.timeline({
          scrollTrigger: {
            trigger: signature,
            start: "top 65%",
            end: "bottom 85%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        const pairs = [
          [".v4-part-mark", "td:first-child"],
          [".v4-part-name", "strong"],
          [".v4-part-role", "td:last-child span"],
          [".v4-part-company", "td:last-child span"],
          [".v4-part-contact", "a"],
        ];
        pairs.forEach(([partSelector, targetSelector], index) => {
          const part = signature.querySelector<HTMLElement>(partSelector!);
          const target = signature.querySelector<HTMLElement>(
            `.v4-signature-output ${targetSelector}`,
          );
          if (!part || !target) return;
          // offsetLeft/Top follow layout rather than the in-flight GSAP transform.
          const position = (element: HTMLElement) => {
            let x = 0,
              y = 0;
            for (
              let current: HTMLElement | null = element;
              current && current !== signature;
              current = current.offsetParent as HTMLElement | null
            ) {
              x += current.offsetLeft;
              y += current.offsetTop;
            }
            return { x, y };
          };
          assembly.to(
            part,
            {
              x: () =>
                position(target).x - position(part).x + (index === 3 ? 112 : 0),
              y: () => position(target).y - position(part).y,
              scale: () =>
                parseFloat(getComputedStyle(target).fontSize) /
                parseFloat(getComputedStyle(part).fontSize),
              transformOrigin: "left top",
              duration: 0.7,
              ease: "power2.inOut",
            },
            index * 0.035,
          );
        });
        assembly
          .fromTo(
            signature.querySelector(".v4-email"),
            { y: 0, rotation: 0, opacity: 0.35 },
            { y: 0, rotation: 0, opacity: 1, duration: 0.45 },
            0.45,
          )
          .fromTo(signature.querySelectorAll(".v4-email > p, .v4-email-header"),
            { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.9)
          .to(
            signature.querySelector(".v4-identity-parts"),
            { opacity: 0, duration: 0.08 },
            0.87,
          )
          .fromTo(
            signature.querySelector(".v4-signature-output"),
            { opacity: 0 },
            { opacity: 1, duration: 0.08 },
            0.87,
          );
      }
      const field = root.querySelector<HTMLElement>(".v4-event-field");
      if (field) {
        const events = gsap.timeline({
          scrollTrigger: {
            trigger: field,
            start: "top 90%",
            end: "bottom 75%",
            scrub: true,
          },
        });
        field.querySelectorAll(".v4-event-strike").forEach((strike, index) => {
          const at = index * 0.24;
          events
            .fromTo(
              strike.querySelector(".v4-arrival-path path"),
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 0.23, ease: "none" },
              at,
            )
            .fromTo(
              strike.querySelector(".v4-strike-head"),
              { scale: 0.2, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.1 },
              at + 0.22,
            )
            .fromTo(
              strike.querySelector(".v4-impact"),
              { scale: 0.6, opacity: 0 },
              { scale: 1.6, opacity: 0.65, duration: 0.08 },
              at + 0.22,
            )
            .to(
              strike.querySelector(".v4-impact"),
              { scale: 2, opacity: 0, duration: 0.15 },
              at + 0.3,
            )
            .fromTo(
              strike.querySelector(".v4-strike-record"),
              { y: 10, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.12 },
              at + 0.3,
            );
        });
      }
      const workspace = root.querySelector<HTMLElement>(
        ".v4-workspace-assembly",
      );
      if (workspace) {
        const settle = gsap.timeline({
          scrollTrigger: {
            trigger: workspace,
            start: "top 95%",
            end: "center 65%",
            scrub: true,
          },
        });
        settle
          .fromTo(
            workspace.querySelector(".v4-assembly-route"),
            { x: -160, y: -90, rotation: -8 },
            { x: 0, y: 0, rotation: 0, duration: 1 },
            0,
          )
          .fromTo(
            workspace.querySelector(".v4-assembly-card"),
            { x: 40, y: -170, rotation: 16 },
            { x: 0, y: 0, rotation: 0, duration: 1 },
            0,
          )
          .fromTo(
            workspace.querySelector(".v4-assembly-events"),
            { x: 160, y: -90, rotation: 5 },
            { x: 0, y: 0, rotation: 0, duration: 1 },
            0,
          )
          .fromTo(
            workspace.querySelector(".v4-assembly-rule"),
            { scaleX: 0 },
            { scaleX: 1, duration: 1 },
            0,
          );
      }
      const card = root.querySelector<HTMLElement>(".v4-card-lean");
      let disposeCard: (() => void) | undefined;
      if (card) {
        let bounds: DOMRect | undefined;
        const rx = gsap.quickTo(card, "rotationX", {
          duration: 0.45,
          ease: "power2.out",
        });
        const ry = gsap.quickTo(card, "rotationY", {
          duration: 0.45,
          ease: "power2.out",
        });
        const enter = () => {
          bounds = card.getBoundingClientRect();
        };
        const move = (event: PointerEvent) => {
          if (!bounds || event.pointerType !== "mouse") return;
          rx(
            (-(event.clientY - bounds.top - bounds.height / 2) /
              bounds.height) *
              5,
          );
          ry(
            ((event.clientX - bounds.left - bounds.width / 2) / bounds.width) *
              5,
          );
        };
        const leave = () => {
          rx(0);
          ry(0);
        };
        card.addEventListener("pointerenter", enter);
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        disposeCard = () => {
          card.removeEventListener("pointerenter", enter);
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", leave);
          rx.tween.kill();
          ry.tween.kill();
        };
      }
      gsap.fromTo(
        root.querySelector(".v4-activity-fill"),
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.querySelector(".v4-activity"),
            start: "top 75%",
            end: "center center",
            scrub: true,
          },
        },
      );
      const disposers = Array.from(
        root.querySelectorAll<HTMLElement>("[data-magnetic]"),
      ).map((item) => {
        let bounds: DOMRect;
        const x = gsap.quickTo(item, "x", {
          duration: 0.25,
          ease: "power2.out",
        });
        const y = gsap.quickTo(item, "y", {
          duration: 0.25,
          ease: "power2.out",
        });
        const enter = () => {
          bounds = item.getBoundingClientRect();
        };
        const move = (event: PointerEvent) => {
          if (!bounds || event.pointerType !== "mouse") return;
          x((event.clientX - bounds.left - bounds.width / 2) * 0.06);
          y((event.clientY - bounds.top - bounds.height / 2) * 0.08);
        };
        const leave = () => {
          x(0);
          y(0);
        };
        item.addEventListener("pointerenter", enter);
        item.addEventListener("pointermove", move);
        item.addEventListener("pointerleave", leave);
        return () => {
          item.removeEventListener("pointerenter", enter);
          item.removeEventListener("pointermove", move);
          item.removeEventListener("pointerleave", leave);
          x.tween.kill();
          y.tween.kill();
        };
      });
      return () => {
        window.removeEventListener("wheel", wake);
        window.removeEventListener("keydown", wake);
        root.removeEventListener("click", anchor);
        track.removeEventListener("focusin", focus);
        buttons.forEach((button, i) =>
          button.removeEventListener("click", callbacks[i]!),
        );
        disposers.forEach((dispose) => dispose());
        disposeCard?.();
        disposeField?.();
        gsap.ticker.remove(tick);
        lenis.off("scroll", update);
        lenis.destroy();
      };
    },
    root,
  );
  const explore = (event: MouseEvent) => {
    if (
      enabled &&
      window.matchMedia(
        "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      return;
    const button = (event.target as Element).closest<HTMLElement>(
      "[data-journey-go]",
    );
    if (button)
      root
        .querySelector(`[data-stop="${button.dataset["journeyGo"]}"]`)
        ?.scrollIntoView({ behavior: "auto", block: "start" });
  };
  root.addEventListener("click", explore);
  return () => {
    root.removeEventListener("click", explore);
    media.revert();
  };
}
