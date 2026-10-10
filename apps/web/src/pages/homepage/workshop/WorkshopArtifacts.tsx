import { ArrowDownRight, ArrowUpRight, ContactRound } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const cardUrl = 'https://wrx.example/c/nora-kane';

export function WorkshopArtifacts() {
  return (
    <div className="ow-artifacts">
      <div className="ow-digital" aria-label="Exemple de carte numérique publiée">
        <div className="ow-digital-address"><span /> wrx.example/c/nora-kane <ArrowUpRight size={13} aria-hidden="true" /></div>
        <div className="ow-digital-body">
          <span className="ow-meta">CARTE NUMÉRIQUE / PUBLIÉE</span>
          <div className="ow-avatar" aria-hidden="true">nk.</div>
          <h2>Nora Kane</h2>
          <p>Direction créative<br />Atelier Azur</p>
          <div className="ow-digital-contact">nora@atelier-azur.example <ArrowUpRight size={14} aria-hidden="true" /></div>
          <div className="ow-contact-cue"><ContactRound size={16} aria-hidden="true" /> Enregistrer le contact</div>
        </div>
      </div>

      <div className="ow-card-position">
        <div className="ow-card-angle">
          <article className="ow-paper-card" aria-label="Carte de visite de démonstration de Nora Kane">
            <div className="ow-card-top"><span className="ow-azur-mark">a<span>.</span></span><span>ATELIER AZUR<br />DIRECTION CRÉATIVE</span></div>
            <div className="ow-card-name">Nora<br />Kane<span className="ow-card-period">.</span></div>
            <div className="ow-card-bottom">
              <div><span className="ow-meta">DES IDÉES. UNE IDENTITÉ.</span><p>nora@atelier-azur.example<br />atelier-azur.example</p></div>
              <div className="ow-card-qr" role="img" aria-label={`QR statique de la carte, exemple encodant ${cardUrl}`}>
                <QRCodeSVG value={cardUrl} size={80} level="M" marginSize={4} bgColor="#f0eee8" fgColor="#202327" />
              </div>
            </div>
          </article>
        </div>
        <span className="ow-card-caption">01 / IDENTITÉ IMPRIMÉE <span>QR STATIQUE → CARTE PUBLIÉE</span></span>
      </div>

      <figure className="ow-qr-proof">
        <div className="ow-proof-heading"><span className="ow-proof-dot" /> ÉPREUVE / QR DIRECT</div>
        <div className="ow-proof-code" role="img" aria-label="QR direct de démonstration encodant https://atelier-azur.example">
          <QRCodeSVG value="https://atelier-azur.example" size={132} marginSize={4} level="M" bgColor="#f0eee8" fgColor="#202327" />
        </div>
        <figcaption>atelier-azur.example<span>CONTENU ENCODÉ DIRECTEMENT</span></figcaption>
        <span className="ow-proof-corner ow-proof-corner-a" aria-hidden="true" /><span className="ow-proof-corner ow-proof-corner-b" aria-hidden="true" />
      </figure>

      <div className="ow-link-proof" aria-label="Épreuve du lien WRX stable">
        <span className="ow-link-proof-label"><span /> LIEN WRX</span>
        <strong>wrx.example/r/atelier</strong>
        <ArrowDownRight size={22} aria-hidden="true" />
      </div>
    </div>
  );
}
