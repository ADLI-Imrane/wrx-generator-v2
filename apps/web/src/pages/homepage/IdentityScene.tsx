import { ArrowUpRightFromSquare, ContactRound, ArrowDownRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const publicCardUrl = 'https://wrx.example/c/nora-kane';

export function IdentityScene() {
  return (
    <section className="wrx-scene wrx-identity" id="identity" aria-labelledby="identity-title" data-scene="identity">
      <div className="wrx-identity-intro">
        <div><p className="wrx-kicker">04 / TRANSMETTRE</p><h2 id="identity-title">Du papier<br /><em>à la personne.</em></h2></div>
        <p>Une carte imprimée ouvre son pendant numérique. Le QR reste statique et pointe vers la carte publiée.</p>
      </div>

      <div className="wrx-identity-stage">
        <article className="wrx-business-artifact" aria-label="Carte de visite de démonstration">
          <div className="wrx-business-top"><strong>WRX</strong><span>ATELIER AZUR / CASABLANCA</span></div>
          <div className="wrx-business-person"><h3>Nora Kane</h3><p>Fondatrice · Atelier Azur</p></div>
          <div className="wrx-business-bottom">
            <div><span>CONTACT</span><strong>nora@atelier-azur.example</strong><strong>+212 600 000 000</strong></div>
            <div className="wrx-static-qr" role="img" aria-label={`QR statique de démonstration encodant ${publicCardUrl}`}><QRCodeSVG value={publicCardUrl} size={62} level="M" marginSize={4} bgColor="#f0eee8" fgColor="#191b1e" /></div>
          </div>
          <span className="wrx-business-url">wrx.example/c/nora-kane</span>
        </article>

        <div className="wrx-identity-bridge" aria-hidden="true"><span className="wrx-bridge-fill" /><span className="wrx-bridge-origin" /><span /><span className="wrx-bridge-arrow">→</span><span /></div>

        <article className="wrx-public-card" aria-label="Aperçu illustratif d’une carte numérique publiée">
          <div className="wrx-public-card-browser"><span /><span /><span /><small>wrx.example/c/nora-kane</small></div>
          <div className="wrx-public-card-body">
            <p className="wrx-identity-micro"><span /> CARTE PUBLIÉE · EXEMPLE</p>
            <div className="wrx-public-avatar" aria-hidden="true">NK</div>
            <h3>Nora Kane</h3>
            <p className="wrx-public-role">Fondatrice · Atelier Azur</p>
            <div className="wrx-public-rule" />
            <div className="wrx-public-field"><span>Email</span><strong>nora@atelier-azur.example</strong><ArrowUpRightFromSquare size={14} aria-hidden="true" /></div>
            <div className="wrx-public-field"><span>Site</span><strong>atelier-azur.example</strong><ArrowUpRightFromSquare size={14} aria-hidden="true" /></div>
            <div className="wrx-vcard-cue"><ContactRound size={16} aria-hidden="true" /> Enregistrer le contact <ArrowDownRight size={15} aria-hidden="true" /></div>
          </div>
        </article>
      </div>
      <div className="wrx-identity-caption"><span className="wrx-blue-mark" /> Ce QR statique ouvre la carte publiée. <span>EXEMPLE SYNTHÉTIQUE · PAS DE SUIVI DE VUES</span></div>
    </section>
  );
}
