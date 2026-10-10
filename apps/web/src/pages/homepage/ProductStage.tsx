import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnalyticsScene } from './AnalyticsScene';
import { DestinationScene } from './DestinationScene';
import { EmailSignatureScene } from './EmailSignatureScene';
import { IdentityScene } from './IdentityScene';
import { QRScene } from './QRScene';
import { RoutingScene } from './RoutingScene';
import { WorkspaceScene } from './WorkspaceScene';

gsap.registerPlugin(ScrollTrigger);

type ProductStageProps = {
  destination: string;
  selectedDestination: 'menu' | 'boutique';
  onDestinationChange: (destination: 'menu' | 'boutique') => void;
};

const cinematicQuery = '(min-width: 901px) and (min-height: 800px) and (prefers-reduced-motion: no-preference)';

export function ProductStage({ destination, selectedDestination, onDestinationChange }: ProductStageProps) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window.matchMedia !== 'function') return;

    const media = gsap.matchMedia();
    media.add({ cinematic: cinematicQuery }, (context) => {
      const beats = gsap.utils.toArray<HTMLElement>('[data-product-beat]', root);
      const restoreFlow = () => {
        delete root.dataset['cinematic'];
        beats.forEach((beat) => {
          beat.inert = false;
          beat.style.removeProperty('opacity');
          beat.style.removeProperty('visibility');
          beat.style.removeProperty('transform');
          beat.style.removeProperty('pointer-events');
        });
      };

      if (!context.conditions?.['cinematic']) {
        restoreFlow();
        return;
      }
      if (beats.length < 2) return;
      const firstBeat = beats[0];
      if (!firstBeat) return;

      const stageContext = gsap.context(() => {
        root.dataset['cinematic'] = 'true';
        gsap.set(beats, { autoAlpha: 0, xPercent: 1.4 });
        gsap.set(firstBeat, { autoAlpha: 1, xPercent: 0 });
        beats.forEach((beat, index) => { beat.inert = index !== 0; });

        const progress = root.querySelector<HTMLElement>('.wrx-stage-progress-fill');
        const position = root.querySelector<HTMLElement>('.wrx-stage-position');
        const total = beats.length - 1;
        let lastIndex = 0;

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * 0.64 * total)}`,
            pin: root,
            pinSpacing: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const index = Math.min(total, Math.round(self.progress * total));
              if (index !== lastIndex) {
                lastIndex = index;
                if (position) position.textContent = `${String(index + 1).padStart(2, '0')} / ${String(beats.length).padStart(2, '0')}`;
              }
            },
          },
        });

        beats.slice(1).forEach((beat, index) => {
          const start = index + 0.62;
          timeline.to(beats[index]!, { autoAlpha: 0, xPercent: -1.4, duration: 0.34 }, start);
          timeline.fromTo(beat, { autoAlpha: 0, xPercent: 1.4 }, { autoAlpha: 1, xPercent: 0, duration: 0.34 }, start);
          timeline.set(beat, { pointerEvents: 'auto' }, start);
          timeline.set(beats[index]!, { pointerEvents: 'none' }, start + 0.34);
          timeline.set(beat, { inert: false }, start);
          timeline.set(beats[index]!, { inert: true }, start + 0.34);
        });

        const route = root.querySelector<HTMLElement>('.wrx-route-track');
        const signal = root.querySelector<HTMLElement>('.wrx-route-signal');
        if (route && signal) {
          timeline.to(signal, {
            x: () => Math.max(0, route.clientWidth - signal.offsetWidth),
            duration: 0.66,
            ease: 'none',
          }, 0.96);
        }

        if (progress) timeline.fromTo(progress, { scaleX: 0 }, {
          scaleX: 1,
          transformOrigin: 'left center',
          ease: 'none',
          duration: total,
        }, 0);
      }, root);

      return () => {
        stageContext.revert();
        restoreFlow();
      };
    });

    return () => media.revert();
  }, []);

  return (
    <section ref={rootRef} className="wrx-product-stage" id="product-story" aria-label="Le parcours des outils WRX">
      <div className="wrx-product-stage-shell">
        <div className="wrx-stage-rail" aria-hidden="true">
          <span>WRX / SIGNAL RELAY</span>
          <span className="wrx-stage-position">01 / 07</span>
          <span className="wrx-stage-progress"><i className="wrx-stage-progress-fill" /></span>
        </div>
        <div className="wrx-stage-viewport">
          <div className="wrx-stage-frame" aria-hidden="true"><i /><i /><i /><i /><b /></div>
          <div className="wrx-stage-beats">
            <div className="wrx-product-stage-beat" data-product-beat><DestinationScene /></div>
            <div className="wrx-product-stage-beat" data-product-beat><RoutingScene destination={destination} selectedDestination={selectedDestination} onDestinationChange={onDestinationChange} /></div>
            <div className="wrx-product-stage-beat" data-product-beat><QRScene destination={destination} /></div>
            <div className="wrx-product-stage-beat" data-product-beat><IdentityScene /></div>
            <div className="wrx-product-stage-beat" data-product-beat><EmailSignatureScene /></div>
            <div className="wrx-product-stage-beat" data-product-beat><AnalyticsScene /></div>
            <div className="wrx-product-stage-beat" data-product-beat><WorkspaceScene /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
