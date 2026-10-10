import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useWorkshopMotion() {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = surfaceRef.current;
    if (!root || typeof window.matchMedia !== 'function') return;
    const media = gsap.matchMedia();
    media.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const position = root.querySelector<HTMLElement>('.ow-card-position');
      const angle = root.querySelector<HTMLElement>('.ow-card-angle');
      const card = root.querySelector<HTMLElement>('.ow-paper-card');
      if (!position || !angle || !card) return;

      // Two wrappers: scroll owns the placement; pointer owns only the inner tilt.
      const context = gsap.context(() => {
        const movement = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: root, start: 'top top', end: '+=650', scrub: true },
        });
        movement.to(position, { y: 110, x: -24, duration: 1 }, 0);
        movement.fromTo(angle, { rotation: -9, rotationX: 7 }, { rotation: -2, rotationX: 0, duration: 1 }, 0);
      }, root);

      const tiltX = gsap.quickTo(card, 'rotationX', { duration: 0.35, ease: 'power2.out' });
      const tiltY = gsap.quickTo(card, 'rotationY', { duration: 0.35, ease: 'power2.out' });
      let width = 1;
      let height = 1;
      const measure = () => { width = position.clientWidth; height = position.clientHeight; };
      const respond = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        // Offset coordinates use the stable hit area; no layout reads in this hot path.
        tiltX((0.5 - event.offsetY / height) * 2);
        tiltY((event.offsetX / width - 0.5) * 3);
      };
      const reset = () => { tiltX(0); tiltY(0); };
      position.addEventListener('pointerenter', measure);
      position.addEventListener('pointermove', respond);
      position.addEventListener('pointerleave', reset);
      return () => {
        position.removeEventListener('pointerenter', measure);
        position.removeEventListener('pointermove', respond);
        position.removeEventListener('pointerleave', reset);
        tiltX.tween.kill();
        tiltY.tween.kill();
        gsap.set(card, { clearProps: 'transform' });
        context.revert();
      };
    });
    return () => media.revert();
  }, []);

  return surfaceRef;
}
