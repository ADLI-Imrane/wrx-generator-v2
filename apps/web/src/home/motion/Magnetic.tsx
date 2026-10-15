import { useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { m, useMotionValue, useSpring } from 'motion/react';
import { finePointer, motionAllowed } from './env';

/** Pulls its child gently toward a fine pointer. Motion values only; no React state. */
export function Magnetic({
  children,
  strength = 0.28,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !finePointer() || !motionAllowed()) return;
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    x.set((event.clientX - (box.left + box.width / 2)) * strength);
    y.set((event.clientY - (box.top + box.height / 2)) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.div
      ref={ref}
      className="h-magnetic"
      style={{ x: sx, y: sy }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </m.div>
  );
}
