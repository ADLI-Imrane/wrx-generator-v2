import { useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, Link2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const modes = [
  { key: 'link', label: 'Raccourcir', icon: Link2, input: 'https://example.com/une-grande-idée', output: 'wrx / idée' },
  { key: 'qr', label: 'Encoder', icon: QrCode, input: 'Votre destination, prête à scanner.', output: 'QR' },
] as const;

export function TransformationDemo({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState(0);
  const selected = modes[mode]!;
  return <div className={`transformation-demo ${compact ? 'demo-compact' : ''}`} data-tool={selected.key}>
    <div className="demo-caption"><span className="eyebrow">WRX / Transformation</span><span>Démo illustrative</span></div>
    <div className="demo-tabs" role="group" aria-label="Explorer les outils">{modes.map((item, index) => <button key={item.key} type="button" aria-pressed={mode === index} onClick={() => setMode(index)}><item.icon size={17} /><span>{item.label}</span></button>)}</div>
    <div className="demo-input"><span className="eyebrow">Entrée</span><p key={`${mode}-input`}>{selected.input}</p></div>
    <div className="demo-bridge" aria-hidden="true"><span /><ArrowDown size={20} /><span /></div>
    <div className="demo-output" key={selected.key}><span className="eyebrow">Sortie / {String(mode + 1).padStart(2, '0')}</span>
      {mode === 1 ? <QRCodeSVG value="https://example.com" size={136} marginSize={2} bgColor="transparent" fgColor="#193027" title="QR de démonstration vers example.com" /> : <strong>{selected.output}<ArrowUpRight size={34} /></strong>}
      <span className="demo-ready"><Check size={13} />{mode === 0 ? 'Une adresse, à partager' : 'Un contenu, à scanner'}</span>
    </div>
  </div>;
}
