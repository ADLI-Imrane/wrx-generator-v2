import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type SceneSetup = (root: HTMLElement) => void;

/** Each scene owns its own small matchMedia/context lifetime. */
export function useSceneMotion<T extends HTMLElement>(setup: SceneSetup) {
  const rootRef = useRef<T>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window.matchMedia !== 'function') return;

    const media = gsap.matchMedia();
    media.add(
      {
        desktop: '(min-width: 901px) and (min-height: 800px)',
        motion: '(prefers-reduced-motion: no-preference)',
      },
      (context) => {
        if (!context.conditions?.['desktop'] || !context.conditions['motion']) return;
        const scene = gsap.context(() => setup(root), root);
        return () => scene.revert();
      },
    );

    return () => media.revert();
  }, [setup]);

  return rootRef;
}
