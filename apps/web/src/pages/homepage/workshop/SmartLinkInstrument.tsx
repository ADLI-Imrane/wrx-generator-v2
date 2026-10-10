import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Link2 } from 'lucide-react';
import gsap from 'gsap';

const destinations = {
  a: { label: 'Le portfolio', address: 'atelier-azur.example/portfolio', path: 'M 12 110 H 130 C 166 110 166 55 202 55 H 352', y: 55 },
  b: { label: 'Le prochain projet', address: 'atelier-azur.example/contact', path: 'M 12 110 H 130 C 166 110 166 165 202 165 H 352', y: 165 },
} as const;

export function SmartLinkInstrument() {
  const [selected, setSelected] = useState<keyof typeof destinations>('a');
  const destination = destinations[selected];
  const routeRef = useRef<SVGPathElement>(null);
  const endpointRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const duration = window.matchMedia('(min-width: 901px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.42 : 0;
    const route = gsap.to(routeRef.current, { attr: { d: destination.path }, duration, ease: 'power2.inOut' });
    const endpoint = gsap.to(endpointRef.current, { attr: { cy: destination.y }, duration, ease: 'power2.inOut' });
    return () => { route.kill(); endpoint.kill(); };
  }, [destination]);

  return (
    <section className="ow-link-instrument" id="smart-link" aria-labelledby="ow-link-title">
      <div className="ow-link-intro">
        <div><p className="ow-meta ow-blue-label">02 / UNE ADRESSE, EN USAGE</p><h2 id="ow-link-title">Le lien reste.<br /><span>La suite vous appartient.</span></h2></div>
        <p>Votre destination peut changer.<br />L’adresse que vous partagez reste la même.</p>
      </div>

      <div className="ow-route-instrument" data-destination={selected}>
        <div className="ow-fixed-link">
          <div className="ow-fixed-link-label"><Link2 size={18} aria-hidden="true" /><span>VOTRE LIEN WRX</span><span className="ow-fixed-label">FIXE</span></div>
          <strong>wrx.example/r/atelier</strong>
          <span className="ow-fixed-note">Une seule adresse à partager.</span>
          <span className="ow-fixed-origin" aria-hidden="true" />
        </div>

        <div className="ow-route" aria-hidden="true">
          <svg viewBox="0 0 364 220" preserveAspectRatio="none">
            <path className="ow-route-guide" d="M 12 110 H 130 C 166 110 166 55 202 55 H 352 M 130 110 C 166 110 166 165 202 165 H 352" />
            <path ref={routeRef} className="ow-route-active" d={destinations.a.path} />
            <circle cx="12" cy="110" r="4" />
            <circle ref={endpointRef} className="ow-route-endpoint" cx="352" cy={destinations.a.y} r="4" />
          </svg>
          <span className="ow-route-caption">DESTINATION MODIFIABLE</span>
        </div>

        <div className="ow-destination" aria-live="polite" aria-atomic="true">
          <span className="ow-meta">DESTINATION {selected.toUpperCase()}</span>
          <h3>{destination.label}</h3>
          <span className="ow-destination-address">{destination.address}</span>
          <ArrowUpRight size={25} aria-hidden="true" />
        </div>
      </div>

      <div className="ow-demo-controls">
        <div className="ow-destination-switch" role="group" aria-label="Changer la destination de démonstration">
          <button type="button" aria-pressed={selected === 'a'} onClick={() => setSelected('a')}><span>A</span> Destination A</button>
          <button type="button" aria-pressed={selected === 'b'} onClick={() => setSelected('b')}><span>B</span> Destination B</button>
        </div>
        <p>Exemple interactif · aucune donnée de compte modifiée.</p>
      </div>
      <div className="ow-workshop-end"><span>WRX / L’ATELIER NUMÉRIQUE</span><span>PROTOTYPE VISUEL · 01—02</span></div>
    </section>
  );
}
