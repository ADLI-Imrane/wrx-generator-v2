import { afterEach, describe, expect, it, vi } from 'vitest';
import { boundaryState, createHeroBoundary } from './createHeroBoundary';
import type { BrandConstruction } from './createBrandConstruction';

const mocks = vi.hoisted(() => ({ create: vi.fn(), kill: vi.fn(), refresh: vi.fn(), disconnect: vi.fn() }));
vi.mock('gsap', () => ({ default: { registerPlugin: vi.fn() } }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: mocks.create } }));

function setup(reduced = false) {
  vi.clearAllMocks();
  const preference = { matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('matchMedia',() => preference);
  vi.stubGlobal('ResizeObserver',class { observe = vi.fn(); disconnect = mocks.disconnect; });
  mocks.create.mockReturnValue({ progress: 0, kill: mocks.kill, refresh: mocks.refresh });
  document.body.innerHTML = '<main class="bh-page"><div class="bh-object"></div><svg class="bh-route"><path class="bh-route-path" /></svg><div class="bh-route-address">wrx.example/r/azur</div></main>';
  const root = document.querySelector<HTMLElement>('main')!;
  const host = root.querySelector<HTMLElement>('.bh-object')!;
  const path = root.querySelector<SVGPathElement>('path')!;
  Object.defineProperty(path,'getTotalLength',{value: () => 600});
  const unsubscribe = vi.fn();
  const construction: BrandConstruction = {
    setRelease: vi.fn(), dispose: vi.fn(),
    subscribeLayout: callback => { callback({origin:{x:400,y:300},exit:{x:350,y:300},mobile:false}); return unsubscribe; },
  };
  return { root,host,path,construction,unsubscribe,preference };
}
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });

describe('Hero cut boundary', () => {
  it('releases the physical cut before the route and evidence become visible', () => {
    expect(boundaryState(0)).toEqual({ release:0,continuation:0,rule:0,address:0 });
    expect(boundaryState(.25)).toMatchObject({ rule:0,address:0 });
    expect(boundaryState(.5).continuation).toBe(1);
    expect(boundaryState(.5).rule).toBeGreaterThan(0);
    expect(boundaryState(.5).address).toBeGreaterThan(0);
    expect(boundaryState(1)).toEqual({ release:1,continuation:1,rule:1,address:1 });
    expect(boundaryState(-1)).toEqual(boundaryState(0));
    expect(boundaryState(2)).toEqual(boundaryState(1));
  });

  it('uses one unpinned native-scroll trigger and reverses the same state', () => {
    const {root,host,path,construction} = setup();
    const dispose = createHeroBoundary(root,host,construction);
    expect(mocks.create).toHaveBeenCalledOnce();
    const options = mocks.create.mock.calls[0]![0] as { onUpdate: (value:{progress:number}) => void; pin?: boolean; scrub?: number };
    expect(options.pin).toBeUndefined();
    expect(options.scrub).toBeUndefined();
    options.onUpdate({progress:.75});
    expect(construction.setRelease).toHaveBeenLastCalledWith(1,1);
    options.onUpdate({progress:0});
    expect(construction.setRelease).toHaveBeenLastCalledWith(0,0);
    expect(path.style.strokeDashoffset).toBe('600');
    dispose();
    expect(mocks.kill).toHaveBeenCalledOnce();
  });

  it('keeps a static aligned route without a scrubbed WebGL operation for reduced motion', () => {
    const {root,host,path,construction,preference} = setup(true);
    const dispose = createHeroBoundary(root,host,construction);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(construction.setRelease).toHaveBeenLastCalledWith(0,0);
    expect(path.style.strokeDashoffset).toBe('0');
    expect(root.querySelector<HTMLElement>('.bh-route-address')!.style.opacity).toBe('1');
    expect(preference.addEventListener).toHaveBeenCalledWith('change',expect.any(Function));
    dispose();
  });

  it('removes the observer, projection subscription and preference listener on teardown', () => {
    const {root,host,construction,preference,unsubscribe} = setup();
    createHeroBoundary(root,host,construction)();
    expect(mocks.disconnect).toHaveBeenCalledOnce();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(preference.removeEventListener).toHaveBeenCalledWith('change',expect.any(Function));
    expect(root.dataset['motion']).toBeUndefined();
  });
});
