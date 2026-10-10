import { ArrowUpRight } from 'lucide-react';

function RegistrationFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`wrx-address-frame ${className}`}>
      <span className="wrx-frame-corner wrx-frame-tl" aria-hidden="true" />
      <span className="wrx-frame-corner wrx-frame-tr" aria-hidden="true" />
      <span className="wrx-frame-corner wrx-frame-bl" aria-hidden="true" />
      <span className="wrx-frame-corner wrx-frame-br" aria-hidden="true" />
      {children}
    </div>
  );
}

export function HeroVisual() {
  return (
    <div className="wrx-visual wrx-visual-artifact" aria-label="Artefact imprimé illustrant un support WRX">
      <div className="wrx-artifact-back" aria-hidden="true">
        <span>WRX / STUDIO SYSTEM</span><i /><i /><i />
      </div>
      <div className="wrx-artifact-sheet">
        <div className="wrx-artifact-top"><span>WRX</span><span>IDENTITÉ / 01</span></div>
        <div className="wrx-artifact-rule" />
        <div className="wrx-artifact-title">Ce qui compte<br /><em>circule.</em></div>
        <div className="wrx-artifact-bottom">
          <div><span>SUPPORT</span><strong>LIEN · QR · CARTE</strong></div>
          <RegistrationFrame className="wrx-artifact-stamp"><span className="wrx-artifact-dot" /><span>WRX</span></RegistrationFrame>
        </div>
      </div>
      <div className="wrx-artifact-address">
        <span className="wrx-address-link-marker" />
        <span>LIEN WRX</span><strong>wrx.li/atelier-azur</strong><ArrowUpRight size={15} aria-hidden="true" />
      </div>
      <span className="wrx-artifact-note">UN OBJET, PRÊT À PARTAGER</span>
    </div>
  );
}
