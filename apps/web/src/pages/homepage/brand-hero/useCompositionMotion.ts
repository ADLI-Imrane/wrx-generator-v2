import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Scene-owned transforms only. No pin, scroll state, smoothing or perpetual work. */
export function useCompositionMotion(
  root: RefObject<HTMLElement>,
  kind: "identity" | "activity",
) {
  useEffect(() => {
    if (!root.current) return;
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 801px) and (prefers-reduced-motion: no-preference)",
      () => {
        const context = gsap.context(() => {
          if (kind === "identity") {
            gsap.fromTo(
              ".pc-paper-card",
              { rotation: -7, y: 55 },
              {
                rotation: -1,
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: ".pc-identity-pair",
                  start: "top 85%",
                  end: "center 45%",
                  scrub: true,
                },
              },
            );
            gsap.fromTo(
              ".pc-public-card",
              { y: 90 },
              {
                y: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: ".pc-identity-pair",
                  start: "top 75%",
                  end: "bottom 80%",
                  scrub: true,
                },
              },
            );
          } else {
            gsap.fromTo(
              ".pc-trace-reader",
              { scaleX: 0 },
              {
                scaleX: 1,
                transformOrigin: "left",
                ease: "none",
                scrollTrigger: {
                  trigger: ".pc-records",
                  start: "top 85%",
                  end: "bottom 55%",
                  scrub: true,
                },
              },
            );
            gsap.fromTo(
              ".pc-workspace-line",
              { scaleX: 0.3 },
              {
                scaleX: 1,
                transformOrigin: "left",
                ease: "none",
                scrollTrigger: {
                  trigger: ".pc-workspace",
                  start: "top 85%",
                  end: "top 40%",
                  scrub: true,
                },
              },
            );
          }
        }, root);
        return () => context.revert();
      },
    );
    return () => media.revert();
  }, [root, kind]);
}
