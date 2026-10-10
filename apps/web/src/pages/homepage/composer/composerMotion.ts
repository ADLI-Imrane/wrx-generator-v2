export const COMPOSER_BAR_COUNT = 16;
export const COMPOSER_URL = 'https://atelier-azur.example';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

/** A far-to-near wave, with a shared opening and closing clearance envelope. */
export function composerBarState(progress: number, index: number) {
  const p = clamp(progress);
  const opening = smooth(p / 0.25);
  const closing = 1 - smooth((p - 0.82) / 0.18);
  const clearance = opening * closing;
  const start = 0.29 + (index / (COMPOSER_BAR_COUNT - 1)) * 0.42;
  const turn = smooth((p - start) / 0.18);
  return {
    rotation: turn * Math.PI / 2,
    spacing: 1 + clearance * 0.22,
    lift: clearance * 0.07 + Math.sin(turn * Math.PI) * 0.75,
  };
}
