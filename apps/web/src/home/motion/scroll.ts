import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const REVEAL = { duration: 0.95, ease: 'power3.out' } as const;
const SCRUB = 1;

const qs = <T extends Element = HTMLElement>(root: ParentNode, sel: string) =>
  root.querySelector<T & Element>(sel) as T | null;
const qsa = <T extends Element = HTMLElement>(root: ParentNode, sel: string) =>
  Array.from(root.querySelectorAll<T & Element>(sel)) as T[];

/** Line-masked heading reveals and block fades. Plays once, never on the hero h1 (LCP). */
function setupReveals(page: HTMLElement) {
  const splits: SplitText[] = [];
  qsa(page, '[data-split]').forEach((el) => {
    splits.push(
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        linesClass: 'h-line',
        onSplit(self) {
          gsap.set(el, { opacity: 1 });
          return gsap.fromTo(
            self.lines,
            { yPercent: 108, opacity: 0, filter: 'blur(8px)' },
            {
              yPercent: 0,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 1.05,
              ease: 'power4.out',
              stagger: 0.06,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }
          );
        },
      })
    );
  });

  ScrollTrigger.batch(qsa(page, '[data-reveal]'), {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.fromTo(
        batch,
        { opacity: 0, y: 32, filter: 'blur(6px)' },
        {
          ...REVEAL,
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          stagger: 0.05,
          clearProps: 'filter,transform',
        }
      ),
  });

  return () => splits.forEach((split) => split.revert());
}

/** The hero interface pieces settle in after load; the h1 is never hidden. */
function setupHero(page: HTMLElement) {
  const pieces = qsa(page, '[data-settle]').sort(
    (a, b) => Number(a.dataset['settle']) - Number(b.dataset['settle'])
  );
  gsap.fromTo(
    pieces,
    { opacity: 0, y: 36, filter: 'blur(8px)' },
    {
      ...REVEAL,
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      stagger: 0.14,
      delay: 0.1,
      clearProps: 'filter',
    }
  );
  const glass = qs(page, '.h-hero__glass');
  const hero = qs(page, '.h-hero');
  if (glass && hero) {
    gsap.to(glass, {
      yPercent: 10,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

/** The fil: one accent line along the page edge that fills with scroll progress. */
function setupThread(page: HTMLElement) {
  const fill = qs(page, '[data-thread-fill]');
  if (!fill) return;
  gsap.fromTo(
    fill,
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: page, start: 'top top', end: 'bottom bottom', scrub: true },
    }
  );
}

function pinFor(section: HTMLElement, length: string) {
  return {
    trigger: section,
    pin: qs(section, '.h-scene__pin'),
    start: 'top top',
    end: length,
    scrub: SCRUB,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  };
}

/** Beat 2: the printed QR leads to a dead page. Fully scrubbed and reversible. */
function setupOldScene(page: HTMLElement) {
  const section = qs(page, '[data-scene="old"]');
  if (!section) return () => undefined;
  section.classList.add('is-scene');
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: pinFor(section, '+=55%') });
  tl.fromTo(qs(section, '[data-old-photo]'), { scale: 1.06 }, { scale: 1, duration: 1 }, 0)
    // States swap with a clipped slide (transform only): text never sits at partial contrast.
    .fromTo(
      qs(section, '[data-old-before]'),
      { yPercent: 0 },
      { yPercent: -112, duration: 0.25 },
      0.45
    )
    .fromTo(
      qs(section, '[data-old-after]'),
      { yPercent: 112 },
      { yPercent: 0, duration: 0.25 },
      0.45
    )
    .fromTo(
      qs(section, '[data-old-stamp]'),
      { scale: 1.6, rotate: -10 },
      { scale: 1, rotate: -4, duration: 0.2 },
      0.62
    )
    .fromTo(qs(section, '[data-old-qr]'), { opacity: 1 }, { opacity: 0.45, duration: 0.2 }, 0.62)
    .to({}, { duration: 0.25 });
  return () => section.classList.remove('is-scene');
}

/** Beat 3: same QR, new destination. */
function setupRuleScene(page: HTMLElement) {
  const section = qs(page, '[data-scene="rule"]');
  if (!section) return () => undefined;
  section.classList.add('is-scene');
  // Dim only the step text (numbers stay full strength) and never below AA contrast.
  const steps = qsa(section, '[data-rule-step] .h-steps__text');
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: pinFor(section, '+=70%') });
  tl.fromTo(steps, { opacity: 0.6 }, { opacity: 0.6, duration: 0.01 }, 0)
    .to(steps[0]!, { opacity: 1, duration: 0.1 }, 0.05)
    .fromTo(qs(section, '[data-rule-qr]'), { y: 24 }, { y: 0, duration: 0.2 }, 0.05)
    .to(steps[0]!, { opacity: 0.6, duration: 0.1 }, 0.3)
    .to(steps[1]!, { opacity: 1, duration: 0.1 }, 0.3)
    // Masked slide (transform only) so neither URL is ever shown at partial contrast.
    .fromTo(
      qs(section, '[data-rule-old]'),
      { yPercent: 0 },
      { yPercent: -160, duration: 0.15 },
      0.35
    )
    .fromTo(qs(section, '[data-rule-new]'), { yPercent: 160 }, { yPercent: 0, duration: 0.15 }, 0.4)
    .fromTo(
      qs(section, '[data-rule-save]'),
      { scale: 1 },
      { scale: 0.94, duration: 0.04, yoyo: true, repeat: 1 },
      0.56
    )
    .fromTo(
      qs(section, '[data-rule-saved]'),
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.08 },
      0.6
    )
    .to(steps[1]!, { opacity: 0.6, duration: 0.1 }, 0.66)
    .to(steps[2]!, { opacity: 1, duration: 0.1 }, 0.66)
    .fromTo(
      qs(section, '[data-rule-route-old]'),
      { yPercent: 0 },
      { yPercent: -220, duration: 0.12 },
      0.7
    )
    .fromTo(
      qs(section, '[data-rule-route-new]'),
      { yPercent: 220 },
      { yPercent: 0, duration: 0.12 },
      0.74
    )
    .to({}, { duration: 0.15 });
  return () => section.classList.remove('is-scene');
}

/** Beat 4: pinned horizontal chapter; tabs follow the visible panel and can jump to it. */
function setupMechScene(page: HTMLElement, lenis: Lenis | null) {
  const section = qs(page, '[data-scene="mech"]');
  const track = section && qs(section, '[data-mech-track]');
  if (!section || !track) return () => undefined;
  section.classList.add('is-scene');
  const distance = () => Math.max(track.scrollWidth - window.innerWidth, 0);
  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    // The track travels faster than the page so the chapter stays under ~1.8 screens.
    scrollTrigger: { ...pinFor(section, '+=80%'), end: () => `+=${Math.round(distance() * 0.5)}` },
  });
  const tabs = qsa<HTMLAnchorElement>(section, '[data-mech-tab]');
  const panels = qsa(section, '[data-mech-panel]');
  panels.forEach((panel, index) => {
    ScrollTrigger.create({
      trigger: panel,
      containerAnimation: tween,
      start: 'left 50%',
      end: 'right 50%',
      onToggle: (self) => {
        tabs[index]?.classList.toggle('is-active', self.isActive);
        if (self.isActive) tabs[index]?.setAttribute('aria-current', 'step');
        else tabs[index]?.removeAttribute('aria-current');
      },
    });
    const ui = qs(panel, '.h-panel__ui');
    if (ui) {
      gsap.fromTo(
        ui,
        { y: 56 },
        {
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: tween,
            start: 'left 95%',
            end: 'left 55%',
            scrub: true,
          },
        }
      );
    }
  });
  const onTab = (event: Event) => {
    const tab = (event.currentTarget as HTMLElement).dataset['mechTab'];
    const panel = panels[Number(tab)];
    const st = tween.scrollTrigger;
    if (!panel || !st) return;
    // Lenis' own anchor handling would scroll to the panel's vertical offset instead.
    event.preventDefault();
    event.stopPropagation();
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const progress = Math.min(Math.max((panel.offsetLeft - pad) / Math.max(distance(), 1), 0), 1);
    const y = st.start + (st.end - st.start) * progress + 2;
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y });
    panel.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
  };
  tabs.forEach((tab) => tab.addEventListener('click', onTab));
  return () => {
    section.classList.remove('is-scene');
    tabs.forEach((tab) => {
      tab.removeEventListener('click', onTab);
      tab.classList.remove('is-active');
      tab.removeAttribute('aria-current');
    });
  };
}

/** Dark-chapter loop: only loads and plays while visible, never with reduced motion or Save-Data. */
function setupVideo(page: HTMLElement) {
  const video = qs<HTMLVideoElement>(page, '[data-loop-video]');
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData;
  if (!video || saveData) return () => undefined;
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        video.preload = 'auto';
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    },
    { rootMargin: '200px 0px' }
  );
  io.observe(video);
  return () => {
    io.disconnect();
    video.pause();
  };
}

/** Cursor spotlight via CSS variables (no React state). */
function setupSpotlight(page: HTMLElement) {
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    const target = (event.target as Element | null)?.closest<HTMLElement>('.h-spot');
    if (!target) return;
    const box = target.getBoundingClientRect();
    target.style.setProperty('--x', `${event.clientX - box.left}px`);
    target.style.setProperty('--y', `${event.clientY - box.top}px`);
  };
  page.addEventListener('pointermove', onMove, { passive: true });
  return () => page.removeEventListener('pointermove', onMove);
}

function setupHeader(page: HTMLElement) {
  const header = qs(page, '[data-header]');
  if (!header) return;
  ScrollTrigger.create({
    start: 24,
    end: 'max',
    onToggle: (self) => header.classList.toggle('is-scrolled', self.isActive),
  });
}

export function setupScroll(page: HTMLElement) {
  const html = document.documentElement;
  const cleanups: (() => void)[] = [];
  let lenis: Lenis | null = null;
  const raf = (time: number) => lenis?.raf(time * 1000);

  try {
    cleanups.push(setupSpotlight(page));
    setupHeader(page);

    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        desktop:
          '(min-width: 900px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)',
      },
      (context) => {
        const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
        if (!motion) {
          html.classList.remove('motion');
          return undefined;
        }
        lenis = new Lenis({ autoRaf: false, syncTouch: false, anchors: { offset: -72 } });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        const local: (() => void)[] = [];
        // Pinned scenes first so later triggers account for their pin spacing.
        if (desktop) {
          local.push(setupOldScene(page), setupRuleScene(page), setupMechScene(page, lenis));
        }
        setupHero(page);
        setupThread(page);
        local.push(setupReveals(page), setupVideo(page));
        ScrollTrigger.sort();
        ScrollTrigger.refresh();

        return () => {
          local.forEach((fn) => fn());
          gsap.ticker.remove(raf);
          lenis?.destroy();
          lenis = null;
        };
      }
    );
    cleanups.push(() => mm.revert());

    // Fonts change line breaks and section heights: re-measure once they are in.
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
  } catch (error) {
    // Never leave content hidden if the choreography fails.
    html.classList.remove('motion');
    console.error(error);
  }

  return () => cleanups.forEach((fn) => fn());
}
