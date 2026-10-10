import { describe, expect, it } from 'vitest';
import { COMPOSER_BAR_COUNT, composerBarState } from './composerMotion';

describe('Composer articulated wave', () => {
  it('starts with a flush URL surface and ends with a flush quarter-turned QR surface', () => {
    for (let i = 0; i < COMPOSER_BAR_COUNT; i++) {
      expect(composerBarState(0, i)).toEqual({ rotation: 0, spacing: 1, lift: 0 });
      expect(composerBarState(1, i).rotation).toBeCloseTo(Math.PI / 2);
      expect(composerBarState(1, i).spacing).toBe(1);
      expect(composerBarState(1, i).lift).toBeCloseTo(0);
    }
  });
  it('preserves URL rows while the upper QR rows have turned in the approval frame', () => {
    expect(composerBarState(0.6, 0).rotation).toBeCloseTo(Math.PI / 2);
    expect(composerBarState(0.6, 15).rotation).toBe(0);
    const rotations = Array.from({ length: COMPOSER_BAR_COUNT }, (_, i) => composerBarState(0.6, i).rotation);
    expect(rotations.some((rotation) => rotation > 0 && rotation < Math.PI / 2)).toBe(true);
  });
  it('has no history-dependent state: reverse scrolling returns through the same geometry', () => {
    const before = composerBarState(0.54, 7);
    composerBarState(1, 7);
    expect(composerBarState(0.54, 7)).toEqual(before);
  });
});
