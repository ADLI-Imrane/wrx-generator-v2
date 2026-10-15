import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { animate, m, useInView, useMotionValue } from 'motion/react';
import { motionAllowed } from './env';

/** Wipes a cover off the chart once it enters the viewport (transform only). */
export function ChartReveal({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cover = useMotionValue(0);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const armed = useRef(false);

  useEffect(() => {
    if (!motionAllowed()) return undefined;
    if (!inView) {
      if (!armed.current) {
        cover.set(1);
        armed.current = true;
      }
      return undefined;
    }
    const controls = animate(cover, 0, { duration: 1.4, ease: [0.65, 0, 0.35, 1] });
    return () => controls.stop();
  }, [inView, cover]);

  return (
    <div ref={ref} className={`h-reveal-wipe ${className}`.trim()}>
      {children}
      <m.span className="h-reveal-wipe__cover" style={{ scaleX: cover }} aria-hidden="true" />
    </div>
  );
}
