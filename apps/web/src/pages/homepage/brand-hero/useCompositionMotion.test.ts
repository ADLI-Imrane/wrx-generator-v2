import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCompositionMotion } from './useCompositionMotion';

const motion = vi.hoisted(() => ({ fromTo: vi.fn(), revert: vi.fn(), cleanup: undefined as undefined | (() => void), query: '' }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));
vi.mock('gsap', () => ({ default: {
  registerPlugin: vi.fn(),
  fromTo: motion.fromTo,
  context: (callback: () => void) => { callback(); return { revert: motion.revert }; },
  matchMedia: () => ({
    add: (query: string, callback: () => () => void) => { motion.query = query; if (window.matchMedia(query).matches) motion.cleanup = callback(); },
    revert: () => { motion.cleanup?.(); motion.cleanup = undefined; },
  }),
} }));
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); motion.cleanup = undefined; });

describe('Bounded composition motion', () => {
  it.each(['mobile', 'reduced motion'])('leaves all presentation in normal flow for %s', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const root = { current: document.createElement('section') };
    const view = renderHook(() => useCompositionMotion(root, 'identity'));
    expect(motion.query).toContain('(min-width: 801px)');
    expect(motion.query).toContain('(prefers-reduced-motion: no-preference)');
    expect(motion.fromTo).not.toHaveBeenCalled();
    view.unmount();
  });
  it('creates only two local identity transforms and reverts on unmount', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const root = { current: document.createElement('section') };
    const view = renderHook(() => useCompositionMotion(root, 'identity'));
    expect(motion.fromTo).toHaveBeenCalledTimes(2);
    for (const call of motion.fromTo.mock.calls) {
      expect(call[2].scrollTrigger.scrub).toBe(true);
      expect(call[2].scrollTrigger.pin).toBeUndefined();
    }
    view.unmount();
    expect(motion.revert).toHaveBeenCalledOnce();
  });
});
