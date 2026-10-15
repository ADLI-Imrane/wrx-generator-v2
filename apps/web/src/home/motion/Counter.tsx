import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'motion/react';
import { motionAllowed } from './env';

const formatters = {
  fr: new Intl.NumberFormat('fr-FR'),
  en: new Intl.NumberFormat('en-US'),
};

const format = (lang: 'fr' | 'en', n: number) =>
  formatters[lang].format(n).replace(/\s/g, '\u202f');

/**
 * Server-renders the real value; when motion is allowed it counts up once on first view,
 * then tweens between values. Text is written directly to the node (no React re-render).
 */
export function Counter({ value, lang }: { value: number; lang: 'fr' | 'en' }) {
  const ref = useRef<HTMLElement>(null);
  const [initial] = useState(() => format(lang, value));
  const shown = useRef<number | null>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!motionAllowed()) {
      el.textContent = format(lang, value);
      shown.current = value;
      return undefined;
    }
    if (!inView) {
      if (shown.current === null) {
        el.textContent = format(lang, 0);
        shown.current = 0;
      }
      return undefined;
    }
    const controls = animate(shown.current ?? 0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(lang, Math.round(v));
      },
    });
    shown.current = value;
    return () => controls.stop();
  }, [inView, value, lang]);

  return (
    <strong ref={ref} className="h-kpi__value">
      {initial}
    </strong>
  );
}
