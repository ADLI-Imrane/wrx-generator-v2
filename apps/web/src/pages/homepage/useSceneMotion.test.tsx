import { useCallback } from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductStage } from './ProductStage';
import { useSceneMotion } from './useSceneMotion';

function Fixture({ setup }: { setup: () => void }) {
  const onSetup = useCallback(() => setup(), [setup]);
  const rootRef = useSceneMotion<HTMLElement>(onSetup);
  return <section ref={rootRef} data-testid="scene-motion-fixture" />;
}

describe('homepage scene motion', () => {
  afterEach(() => {
    vi.mocked(window.matchMedia).mockReset();
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it.each([
    { name: 'mobile viewport', width: 390, reduce: false },
    { name: 'reduced motion', width: 1440, reduce: true },
  ])('does not initialize scene timelines for $name', ({ width, reduce }) => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches:
        (!query.includes('min-width: 901px') || width >= 901) &&
        (!query.includes('prefers-reduced-motion: no-preference') || !reduce),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const setup = vi.fn();

    render(<Fixture setup={setup} />);

    expect(setup).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="scene-motion-fixture"]')).toBeInTheDocument();
  });

  it('keeps the complete ProductStage in normal flow under reduced motion', () => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: query.includes('min-width: 901px') && !query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(
      <ProductStage destination="https://atelier-azur.example/menu" selectedDestination="menu" onDestinationChange={vi.fn()} />,
    );
    const stage = container.querySelector<HTMLElement>('.wrx-product-stage');
    const beats = [...container.querySelectorAll<HTMLElement>('[data-product-beat]')];

    expect(stage).not.toHaveAttribute('data-cinematic');
    expect(beats).toHaveLength(7);
    expect(beats.every((beat) => !beat.inert)).toBe(true);
    expect(container.querySelectorAll('.pin-spacer')).toHaveLength(0);
  });
});
