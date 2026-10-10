import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function EmailSignatureScene() {
  const [copyFeedback, setCopyFeedback] = useState<'rich' | 'plain' | 'failed' | null>(null);
  const signatureText = 'Nora Kane\nFondatrice · Atelier Azur\nnora@atelier-azur.example\natelier-azur.example';
  const signatureHtml = '<div style="font-family:Arial,sans-serif;color:#202327"><strong>Nora Kane</strong><br><span>Fondatrice · Atelier Azur</span><br><a href="mailto:nora@atelier-azur.example">nora@atelier-azur.example</a><br><a href="https://atelier-azur.example">atelier-azur.example</a></div>';
  async function copySignature() {
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([signatureHtml], { type: 'text/html' }),
          'text/plain': new Blob([signatureText], { type: 'text/plain' }),
        })]);
        setCopyFeedback('rich');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(signatureText);
        setCopyFeedback('plain');
      } else {
        setCopyFeedback('failed');
        return;
      }
      window.setTimeout(() => setCopyFeedback(null), 2600);
    } catch {
      setCopyFeedback('failed');
    }
  }

  return (
    <section className="wrx-scene wrx-signature" id="email-signature" aria-labelledby="signature-title" data-scene="signature">
      <div className="wrx-signature-heading">
        <div><p className="wrx-kicker">05 / PROLONGER</p><h2 id="signature-title">La même identité.<br /><em>Un autre support.</em></h2></div>
        <p>Une copie de votre identité, modifiable indépendamment.</p>
      </div>
      <div className="wrx-email-composition">
        <div className="wrx-email-window" aria-label="Aperçu illustratif d’un email">
          <div className="wrx-email-window-top"><span /><span /><span /><strong>Nouveau message</strong></div>
          <div className="wrx-email-fields"><div><span>À</span><i>contact@exemple.fr</i></div><div><span>Objet</span><i>Ravi·e de vous rencontrer</i></div></div>
          <div className="wrx-email-body"><p>Bonjour,</p><p>Ravi·e d’avoir échangé avec vous. Voici mes coordonnées.</p><p>À bientôt,</p>
            <div className="wrx-email-signature-output">
              <span className="wrx-signature-label">SIGNATURE · COPIE INDÉPENDANTE</span>
              <div className="wrx-signature-rule" />
              <strong>Nora Kane</strong><span>Fondatrice · Atelier Azur</span><span>nora@atelier-azur.example</span><span>atelier-azur.example</span>
            </div>
          </div>
        </div>
        <div className="wrx-signature-aside">
          <div className="wrx-snapshot-mark"><span /><span /><span /></div>
          <p>CRÉÉE À PARTIR D’UNE IDENTITÉ</p>
          <strong>Puis modifiée<br />à part entière.</strong>
          <button type="button" className="wrx-signature-copy" onClick={() => void copySignature()}>
            {copyFeedback === 'rich' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copyFeedback === 'rich' ? 'Signature copiée' : copyFeedback === 'plain' ? 'Texte brut copié' : copyFeedback === 'failed' ? 'Copie indisponible' : 'Copier la signature'}
          </button>
          <span className="wrx-signature-feedback" aria-live="polite">
            {copyFeedback === 'plain' ? 'Mise en forme non incluse.' : copyFeedback === 'failed' ? 'Sélectionnez le texte de la signature pour le copier manuellement.' : ''}
          </span>
          <small>À installer manuellement dans les réglages de votre messagerie. Le rendu dépend du client email.</small>
        </div>
      </div>
    </section>
  );
}
