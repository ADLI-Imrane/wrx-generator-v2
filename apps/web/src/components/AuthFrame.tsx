import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { TransformationDemo } from './TransformationDemo';

export function AuthFrame({ children }: { children: ReactNode }) {
  return <main className="wrx-auth">
    <aside className="auth-story">
      <Link to="/" className="brand-lockup"><BrandLogo size="compact" alt="" /><span>WRX<small>GENERATOR / V2</small></span></Link>
      <div className="auth-story-copy"><span className="eyebrow">Votre studio de transformation</span><h1>Une idée.<br />La bonne <em>forme.</em></h1><p>Des liens à partager,<br />des codes à scanner.</p></div>
      <TransformationDemo compact />
      <p className="auth-story-foot">LIER. ENCODER.</p>
    </aside>
    <section className="auth-form-area"><Link to="/" className="auth-back"><ArrowLeft size={16} /> Retour à WRX</Link><div className="auth-form-content">{children}</div><p className="auth-fineprint">WRX Generator — votre boîte à outils numérique.</p></section>
  </main>;
}
