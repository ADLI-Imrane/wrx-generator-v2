import { useCallback } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { HeroVisual } from './HeroVisual';
import { useSceneMotion } from './useSceneMotion';

export function HeroScene() {
  const setupMotion = useCallback((root: HTMLElement) => {
    const story = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    story
      .to('.wrx-artifact-back', { y: -18, rotation: 3.5, ease: 'none' }, 0)
      .to('.wrx-artifact-sheet', { y: -16, rotation: -1.5, ease: 'none' }, 0)
      .to('.wrx-artifact-address', { x: -14, y: -22, ease: 'none' }, 0)
      .to('.wrx-artifact-dot', { scale: 1.35, ease: 'none' }, 0);
  }, []);
  const rootRef = useSceneMotion<HTMLElement>(setupMotion);

  return (
    <section ref={rootRef} className="wrx-home-hero" aria-labelledby="wrx-home-title" data-scene="hero">
      <div className="wrx-home-hero-copy">
        <p className="wrx-home-kicker"><span aria-hidden="true" /> OUTILS NUMÉRIQUES, EN MOUVEMENT</p>
        <h1 id="wrx-home-title">Créez.<br /><span>Faites circuler.</span></h1>
        <p className="wrx-home-intro">Liens, QR codes, cartes et signatures : un espace pour créer vos supports et les mettre en usage.</p>
        <div className="wrx-home-hero-actions">
          <Link className="wrx-home-primary" to="/register">Créer mon espace <ArrowUpRight size={18} aria-hidden="true" /></Link>
          <Link className="wrx-home-secondary" to="/login">Se connecter</Link>
        </div>
        <a className="wrx-home-scroll-cue" href="#product-story"><span>UNE INTENTION, PLUSIEURS SUPPORTS</span><ArrowDownRight size={17} aria-hidden="true" /></a>
      </div>
      <div className="wrx-home-hero-stage">
        <HeroVisual />
        <div className="wrx-home-stage-caption"><span>OBJET DE DÉMONSTRATION</span><span>WRX / 001</span></div>
      </div>
      <div className="wrx-home-hero-index" aria-hidden="true">01 <span>—</span> CRÉER</div>
    </section>
  );
}
