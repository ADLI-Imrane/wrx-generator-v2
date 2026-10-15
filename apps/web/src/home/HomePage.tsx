import { LazyMotion, MotionConfig } from 'motion/react';
import type { HomeCopy } from './content';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { OldWay } from './sections/OldWay';
import { Rule } from './sections/Rule';
import { Mechanism } from './sections/Mechanism';
import { TryIt } from './sections/TryIt';
import { Identity } from './sections/Identity';
import { Signal } from './sections/Signal';
import { Payoff } from './sections/Payoff';
import { Action } from './sections/Action';

const loadFeatures = () => import('./motion/features').then((mod) => mod.default);

export function HomePage({ copy }: { copy: HomeCopy }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        <div className="h" data-home lang={copy.lang}>
          <span className="h-thread" aria-hidden="true">
            <i data-thread-fill />
          </span>
          <Header copy={copy} />
          <main id="contenu" tabIndex={-1}>
            <Hero copy={copy} />
            <OldWay copy={copy} />
            <Rule copy={copy} />
            <Mechanism copy={copy} />
            <TryIt copy={copy} />
            <Identity copy={copy} />
            <Signal copy={copy} />
            <Payoff copy={copy} />
            <Action copy={copy} />
          </main>
        </div>
      </LazyMotion>
    </MotionConfig>
  );
}
