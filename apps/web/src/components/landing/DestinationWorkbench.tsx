import { useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Copy, Download, RotateCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const treatments = [
  { name: 'Papier', paper: '#f7f4eb', ink: '#262820' },
  { name: 'Corail', paper: '#fa714f', ink: '#28241f' },
  { name: 'Acide', paper: '#e2eb9f', ink: '#293020' },
];
const example = 'https://example.com';
export function DestinationWorkbench() {
  const [draft, setDraft] = useState('');
  const [destination, setDestination] = useState(example);
  const [label, setLabel] = useState('La suite, ici.');
  const [treatment, setTreatment] = useState(1);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [generated, setGenerated] = useState(false);
  const qr = useRef<HTMLDivElement>(null);
  const colors = treatments[treatment] ?? treatments[0]!;
  const generate = (event: FormEvent) => {
    event.preventDefault();
    try {
      const parsed = new URL(draft.trim());
      if (
        !['https:', 'http:'].includes(parsed.protocol) ||
        !parsed.hostname ||
        parsed.username ||
        parsed.password ||
        draft.length > 512 ||
        new TextEncoder().encode(parsed.href).length > 1200
      )
        throw new Error('invalid');
      setDestination(parsed.href);
      setGenerated(true);
      setError('');
      setFlipped(false);
      setMessage('Votre QR est prêt. Vous pouvez le scanner ou le télécharger.');
    } catch {
      setError(
        'Saisissez une adresse http:// ou https:// valide, sans identifiants (512 caractères maximum).'
      );
      setMessage('');
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(destination);
      setMessage('Destination copiée.');
    } catch {
      setMessage('Copie indisponible. Sélectionnez l’adresse affichée au dos du QR.');
      setFlipped(true);
    }
  };
  const download = () => {
    const svg = qr.current?.querySelector('svg');
    if (!svg) return;
    const contents = new XMLSerializer().serializeToString(svg);
    const objectUrl = URL.createObjectURL(
      new Blob([contents], { type: 'image/svg+xml;charset=utf-8' })
    );
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'wrx-qr.svg';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setMessage('QR téléchargé en SVG. Sa destination est fixe.');
  };
  return (
    <section className="destination-workbench" id="atelier" aria-labelledby="workbench-title">
      <div className="workbench-heading">
        <h2 id="workbench-title">
          <span className="registration-mark" aria-hidden="true" /> L’ATELIER QR
        </h2>
        <span>VOTRE PREMIER POINT DE CONTACT</span>
        <span>ESSAI LIBRE / SANS COMPTE</span>
      </div>
      <div className="workbench-body">
        <div className="workbench-input">
          <span className="home-eyebrow">01 — CHOISISSEZ LA SUITE</span>
          <h3>
            Où voulez-vous
            <br />
            les emmener ?
          </h3>
          <form onSubmit={generate} noValidate>
            <label htmlFor="qr-destination">Votre destination</label>
            <div className="destination-input">
              <input
                id="qr-destination"
                type="url"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError('');
                }}
                placeholder="https://votre-site.com"
                maxLength={512}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'destination-error' : 'destination-help'}
                required
              />
              <button type="submit" aria-label="Générer mon QR">
                <ArrowRight size={22} />
              </button>
            </div>
            {error && (
              <p id="destination-error" className="destination-error" role="alert">
                {error}
              </p>
            )}
            <p id="destination-help">
              Votre URL devient un QR scannable.
              <br />
              Rien n’est envoyé à un serveur.
            </p>
            <label htmlFor="qr-label">Une courte invitation</label>
            <input
              className="label-input"
              id="qr-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={28}
              placeholder="La suite, ici."
            />
          </form>
          <fieldset className="treatment-options">
            <legend>Votre traitement</legend>
            <div>
              {treatments.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setTreatment(index);
                    setMessage('');
                  }}
                  aria-pressed={index === treatment}
                  aria-label={`Palette ${item.name}`}
                >
                  <span style={{ background: item.paper }}>
                    {index === treatment && <Check size={13} />}
                  </span>
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="workbench-note">
            <span>↳</span>
            <p>
              Pour un lien court ou un QR dynamique,
              <br />
              <Link to="/register">
                créez votre espace WRX <ArrowUpRight size={12} />
              </Link>
            </p>
          </div>
        </div>
        <div className="workbench-preview">
          <div className="preview-index">
            <span>02 — PRÊT À CIRCULER</span>
            <span>{generated ? 'VOTRE QR' : 'EXEMPLE / EXAMPLE.COM'}</span>
          </div>
          <div
            className={`qr-pass ${flipped ? 'is-flipped' : ''}`}
            style={{ '--pass-paper': colors.paper, '--pass-ink': colors.ink } as CSSProperties}
          >
            <div className="qr-pass-inner">
              <div className="qr-pass-face qr-pass-front" aria-hidden={flipped}>
                <div className="pass-top">
                  <span className="pass-logo">wrx↗</span>
                  <span>
                    UN POINT DE DÉPART.
                    <br />
                    UNE NOUVELLE SUITE.
                  </span>
                </div>
                <div ref={qr} className="pass-code">
                  <QRCodeSVG
                    value={destination}
                    size={224}
                    fgColor={colors.ink}
                    bgColor={colors.paper}
                    marginSize={4}
                    level="M"
                  />
                </div>
                <div className="pass-invitation">
                  {label.trim() || 'La suite, ici.'}
                  <ArrowUpRight size={23} />
                </div>
                <div className="pass-tear" />
                <div className="pass-bottom">
                  <span>SCANNEZ POUR CONTINUER</span>
                  <span>QR / DIRECT</span>
                </div>
              </div>
              <div className="qr-pass-face qr-pass-back" aria-hidden={!flipped}>
                <span className="home-eyebrow">LA DESTINATION DERRIÈRE LE CODE</span>
                <ArrowUpRight size={52} />
                <p>{destination}</p>
                <span>
                  Un QR direct pointe toujours vers cette adresse. Pour changer de destination,
                  générez un nouveau code.
                </span>
              </div>
            </div>
          </div>
          <button
            className="pass-flip"
            onClick={() => setFlipped((value) => !value)}
            aria-pressed={flipped}
            aria-label="Retourner le QR"
          >
            <RotateCcw size={14} />
            {flipped ? 'Voir le QR' : 'Voir la destination'}
          </button>
        </div>
      </div>
      <div className="workbench-output">
        <p role="status" aria-live="polite">
          {message || 'QR direct · destination fixe · fichier vectoriel'}
        </p>
        <div>
          <button onClick={() => void copy()}>
            <Copy size={15} /> Copier la destination
          </button>
          <button className="download-qr" onClick={download}>
            <Download size={16} /> Télécharger le QR <span>SVG</span>
          </button>
        </div>
      </div>
    </section>
  );
}
