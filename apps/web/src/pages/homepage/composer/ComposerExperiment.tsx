import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrandLogo } from '../../../components/BrandLogo';
import { COMPOSER_URL } from './composerMotion';
import { createComposerBed } from './createComposerBed';
import './composer.css';

gsap.registerPlugin(ScrollTrigger);

export default function ComposerExperiment() {
  const operationRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'WRX — Le Compositeur';
    const operation = operationRef.current;
    const host = hostRef.current;
    const svg = artworkRef.current?.querySelector('svg');
    if (!operation || !host || !svg) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const initialize = async () => {
      await document.fonts?.ready;
      if (cancelled) return;
      const bed = await createComposerBed(host, svg);
      if (cancelled) { bed.dispose(); return; }
      operation.dataset['ready'] = 'true';
      const media = gsap.matchMedia();
      const update = (progress: number) => {
        bed.setProgress(progress);
        operation.dataset['complete'] = String(progress >= 0.999);
        if (stateRef.current) stateRef.current.textContent = progress >= 0.999 ? 'QR DIRECT' : 'ENCODAGE DIRECT';
        if (sliderRef.current) sliderRef.current.value = String(Math.round(progress * 100));
      };
      media.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, (context) => {
        if (context.conditions?.['reduced']) { update(1); return; }
        const trigger = ScrollTrigger.create({
          trigger: operation,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => update(self.progress),
        });
        update(trigger.progress);
        return () => trigger.kill();
      });
      const pointer = { tilt: 0 };
      let pointerTween: gsap.core.Tween | undefined;
      let targetTilt = 0;
      let bounds = host.getBoundingClientRect();
      const measure = () => { bounds = host.getBoundingClientRect(); };
      const respond = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        const nearEdge = x > 0.15 && x < 0.9 && y > 0.65 && y < 0.9;
        const target = nearEdge ? 0.085 : 0;
        if (target === targetTilt || Number(host.dataset['progress']) > 0.015) return;
        targetTilt = target;
        pointerTween?.kill();
        pointerTween = gsap.to(pointer, { tilt: target, duration: 0.22, onUpdate: () => bed.setPointerTilt(pointer.tilt) });
      };
      const reset = () => {
        if (targetTilt === 0) return;
        targetTilt = 0;
        pointerTween?.kill();
        pointerTween = gsap.to(pointer, { tilt: 0, duration: 0.22, onUpdate: () => bed.setPointerTilt(pointer.tilt) });
      };
      host.addEventListener('pointerenter', measure);
      host.addEventListener('pointermove', respond);
      host.addEventListener('pointerleave', reset);
      cleanup = () => {
        host.removeEventListener('pointerenter', measure);
        host.removeEventListener('pointermove', respond);
        host.removeEventListener('pointerleave', reset);
        pointerTween?.kill();
        media.revert();
        bed.dispose();
      };
    };
    void initialize().catch(() => {
      if (!cancelled) {
        operation.dataset['fallback'] = 'true';
        if (stateRef.current) stateRef.current.textContent = 'QR DIRECT';
      }
    });
    return () => { cancelled = true; cleanup?.(); document.title = previousTitle; };
  }, []);

  return (
    <main className="cp-operation" ref={operationRef}>
      <div className="cp-stage">
        <header className="cp-header"><Link to="/" aria-label="WRX, accueil"><BrandLogo /><span>WRX</span></Link><span className="cp-experiment-name">LE COMPOSITEUR / EXPÉRIENCE</span><Link to="/register" className="cp-account">Créer mon espace <ArrowUpRight size={15} aria-hidden="true" /></Link></header>
        <div className="cp-copy"><span className="cp-eyebrow">WRX / INFORMATION EN USAGE</span><h1>Une adresse.<br />Prête à circuler.</h1><p>L’information prend une autre forme.</p><span className="cp-scroll"><ArrowDown size={14} aria-hidden="true" /> Faites défiler pour encoder.</span></div>
        <div className="cp-bed" ref={hostRef} role="img" aria-label="Instrument articulé transformant l’adresse de démonstration en QR direct">
          <div className="cp-placeholder" aria-hidden="true"><span>https://</span><strong>atelier-azur.example</strong></div>
        </div>
        <div className="cp-qr-fallback" ref={artworkRef}><QRCodeSVG value={COMPOSER_URL} size={512} level="M" marginSize={4} bgColor="#f0eee8" fgColor="#111315" /><p>{COMPOSER_URL}</p></div>
        <div className="cp-caption"><span className="cp-index" /> <span>https://atelier-azur.example</span><span className="cp-state" ref={stateRef}>ENCODAGE DIRECT</span></div>
        <div className="cp-operation-control"><label htmlFor="cp-progress">Adresse <span>→</span> QR direct</label><input ref={sliderRef} id="cp-progress" type="range" min="0" max="100" step="1" defaultValue="0" aria-label="Position de l’encodage" onChange={(event) => {
          const operation = operationRef.current;
          if (!operation) return;
          const top = operation.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: top + (operation.offsetHeight - window.innerHeight) * Number(event.target.value) / 100, behavior: 'instant' });
        }} /><span className="cp-demo-label">URL DE DÉMONSTRATION · QR DIRECT, SANS SUIVI</span></div>
      </div>
    </main>
  );
}
