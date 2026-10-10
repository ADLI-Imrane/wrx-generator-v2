import { ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const directUrl = 'https://atelier-azur.example/menu';
const managedUrl = 'https://wrx.example/r/atelier-azur';

export function QRScene({ destination }: { destination: string }) {
  return (
    <section className="wrx-scene wrx-qr-scene" aria-labelledby="qr-scene-title" data-scene="qr">
      <div className="wrx-qr-transition" aria-hidden="true">
        <span className="wrx-qr-transition-label">LIEN STABLE</span>
        <span className="wrx-qr-transition-address">wrx.li/atelier-azur</span>
        <span className="wrx-qr-transition-line" />
        <span className="wrx-qr-transition-marker" />
        <span className="wrx-qr-transition-frame"><i /><i /><i /><i /></span>
      </div>
      <div className="wrx-qr-contrast">
        <div className="wrx-qr-contrast-head">
          <p className="wrx-kicker">03 / ENCODER</p>
          <h2 id="qr-scene-title">Deux QR.<br /><em>Deux logiques.</em></h2>
          <p className="wrx-qr-scene-copy">La géométrie reste familière. Ce qui change, c’est ce que le QR transporte.</p>
        </div>
        <article className="wrx-qr-mode wrx-qr-mode-direct">
          <div className="wrx-mode-heading"><span className="wrx-mode-number">01</span><h3>QR direct</h3><span className="wrx-mode-tag">CONTENU ENCODÉ</span></div>
          <p>Le contenu est encodé dans le QR. Pour changer la destination, il faut créer un nouveau QR.</p>
          <div className="wrx-mode-payload">
            <div className="wrx-direct-qr" role="img" aria-label={`QR direct de démonstration encodant ${directUrl}`}><QRCodeSVG value={directUrl} size={54} level="M" marginSize={4} bgColor="#f0eee8" fgColor="#191b1e" /></div>
            <div><span>CONTENU ENCODÉ</span><code>atelier-azur.example/menu</code></div>
            <ArrowRight size={16} aria-hidden="true" />
          </div>
        </article>
        <article className="wrx-qr-mode wrx-qr-mode-managed">
          <div className="wrx-mode-heading"><span className="wrx-mode-number">02</span><h3>QR géré</h3><span className="wrx-mode-tag">LIEN WRX</span></div>
          <p>Le QR reste le même. Le Lien WRX pilote sa destination pour les prochains scans.</p>
          <div className="wrx-managed-payload">
            <div className="wrx-managed-qr-frame" role="img" aria-label="QR géré de démonstration encodant une adresse WRX stable">
              <i /><i /><i /><i />
              <QRCodeSVG value={managedUrl} size={82} level="M" marginSize={4} bgColor="#f0eee8" fgColor="#191b1e" />
              <span className="wrx-qr-frame-origin" />
            </div>
            <div><span>INGRESS STABLE</span><code>wrx.example/r/atelier-azur</code><i aria-hidden="true" /><span>DESTINATION ACTUELLE</span><strong>{destination.replace('https://', '')}</strong></div>
          </div>
        </article>
      </div>
      <p className="wrx-demo-footnote">Démonstration illustrative. Les QR et adresses affichés ici ne sont pas liés à un compte.</p>
    </section>
  );
}
