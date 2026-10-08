import { useEffect, useRef, useState } from 'react';

export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const displayedValue = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      displayedValue.current = value;
      setDisplay(value);
      return;
    }

    const from = displayedValue.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 520, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (value - from) * eased);
      displayedValue.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <><span aria-hidden="true" className="wrx-data-number">{display.toLocaleString()}</span><span className="sr-only">{value.toLocaleString()}</span></>;
}
