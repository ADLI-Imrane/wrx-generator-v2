import { useRef } from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Lenis from 'lenis';
import { useConceptMotion } from './useConceptMotion';

vi.mock('lenis', () => ({ default: vi.fn() }));

function Fixture({ quiet = false }: { quiet?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useConceptMotion(ref, quiet);
  return (
    <div ref={ref}>
      <section className="hc-stage">
        <h1>Du sens. Du signal.</h1>
      </section>
    </div>
  );
}

describe('concept motion accessibility and isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Original route';
    document.documentElement.classList.remove('wrx-concept-page');
    window.history.replaceState({}, '', '/');
  });

  it.each([
    { name: 'system reduced motion', width: 1440, reduce: true },
    { name: 'mobile native scroll', width: 390, reduce: false },
  ])('does not install smoothing or pinning for $name', ({ width, reduce }) => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches:
        (!query.includes('min-width: 900px') || width >= 900) &&
        (!query.includes('prefers-reduced-motion: no-preference') || !reduce),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const view = render(<Fixture />);
    expect(Lenis).not.toHaveBeenCalled();
    expect(document.querySelector('.pin-spacer')).toBeNull();
    expect(view.getByRole('heading', { level: 1 })).toBeVisible();
    view.unmount();
    expect(document.documentElement).not.toHaveClass('wrx-concept-page');
    expect(document.title).toBe('Original route');
  });

  it('honors the explicit quiet control and restores the previous route title on exit', () => {
    const view = render(<Fixture quiet />);
    expect(Lenis).not.toHaveBeenCalled();
    expect(document.title).toBe('WRX — Faites circuler vos idées');
    view.unmount();
    expect(document.title).toBe('Original route');
    expect(document.documentElement).not.toHaveClass('wrx-concept-page');
  });

  it('keeps the comparison label only on the concept alias', () => {
    window.history.replaceState({}, '', '/homepage-concept');
    const view = render(<Fixture quiet />);
    expect(document.title).toBe('WRX — Faites circuler vos idées · Concept');
    view.unmount();
  });
});
