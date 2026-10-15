import { afterEach, describe, expect, it, vi } from "vitest";
import { createCreativeMotion } from "./createCreativeMotion";

const mocks = vi.hoisted(() => ({
  cleanup: undefined as undefined | (() => void),
  lenis: vi.fn(),
  destroy: vi.fn(),
  raf: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  scrollTo: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  timeline: vi.fn(),
  fromTo: vi.fn(),
  create: vi.fn(),
  saveStyles: vi.fn(),
}));
vi.mock("lenis", () => ({
  default: class {
    isScrolling = false;
    raf = mocks.raf;
    on = mocks.on;
    off = mocks.off;
    destroy = mocks.destroy;
    scrollTo = mocks.scrollTo;
    constructor(options: object) {
      mocks.lenis(options);
    }
  },
}));
vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    update: vi.fn(),
    create: mocks.create,
    saveStyles: mocks.saveStyles,
  },
}));
vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    ticker: { add: mocks.add, remove: mocks.remove },
    fromTo: mocks.fromTo,
    timeline: (options: object) => {
      mocks.timeline(options);
      const timeline = {
        to: () => timeline,
        fromTo: () => timeline,
        scrollTrigger: { start: 100 },
      };
      return timeline;
    },
    matchMedia: () => ({
      add: (query: string, callback: () => (() => void) | undefined) => {
        if (window.matchMedia(query).matches) mocks.cleanup = callback();
      },
      revert: () => {
        mocks.cleanup?.();
        mocks.cleanup = undefined;
      },
    }),
  },
}));
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  mocks.cleanup = undefined;
});
function root() {
  const element = document.createElement("main");
  element.innerHTML =
    '<section class="v4-journey"><div class="v4-journey-stage"><div class="v4-journey-track"></div></div></section>';
  return element;
}
describe("V4 owned motion lifecycle", () => {
  it.each(["mobile", "system reduced motion"])(
    "does not initialize Lenis or pinning for %s",
    () => {
      vi.stubGlobal("matchMedia", () => ({ matches: false }));
      createCreativeMotion(root())();
      expect(mocks.lenis).not.toHaveBeenCalled();
      expect(mocks.timeline).not.toHaveBeenCalled();
    },
  );
  it("does not initialize cinematic motion when explicitly disabled", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    createCreativeMotion(root(), undefined, false)();
    expect(mocks.lenis).not.toHaveBeenCalled();
  });
  it("owns one bounded pin and a demand-driven clock, then releases everything", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const dispose = createCreativeMotion(root());
    expect(mocks.saveStyles).toHaveBeenCalledOnce();
    expect(mocks.lenis).toHaveBeenCalledWith(
      expect.objectContaining({ autoRaf: false, syncTouch: false, lerp: 0.16 }),
    );
    expect(mocks.add).not.toHaveBeenCalled();
    expect(mocks.timeline.mock.calls[0]?.[0].scrollTrigger).toEqual(
      expect.objectContaining({ scrub: true, pin: expect.any(HTMLElement) }),
    );
    window.dispatchEvent(new WheelEvent("wheel"));
    window.dispatchEvent(new WheelEvent("wheel"));
    expect(mocks.add).toHaveBeenCalledOnce();
    const tick = mocks.add.mock.calls[0]?.[0];
    tick(1);
    expect(mocks.raf).toHaveBeenLastCalledWith(16);
    window.dispatchEvent(new WheelEvent("wheel"));
    tick(100);
    expect(mocks.raf).toHaveBeenLastCalledWith(32);
    dispose();
    expect(mocks.destroy).toHaveBeenCalledOnce();
    expect(mocks.off).toHaveBeenCalled();
    const calls = mocks.add.mock.calls.length;
    window.dispatchEvent(new WheelEvent("wheel"));
    expect(mocks.add).toHaveBeenCalledTimes(calls);
  });
});
