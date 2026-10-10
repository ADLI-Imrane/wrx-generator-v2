import { useEffect } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../../../components/BrandLogo';
import { WorkshopArtifacts } from './WorkshopArtifacts';
import { SmartLinkInstrument } from './SmartLinkInstrument';
import { useWorkshopMotion } from './useWorkshopMotion';
import './open-workshop.css';

export default function OpenWorkshop() {
  const surfaceRef = useWorkshopMotion();
  useEffect(() => {
    const previous = document.title;
    document.title = 'WRX — Faites-en quelque chose.';
    return () => { document.title = previous; };
  }, []);

  return (
    <div className="ow-home">
      <a className="ow-skip" href="#ow-main">Aller au contenu</a>
      <header className="ow-header">
        <Link className="ow-brand" to="/" aria-label="WRX, accueil"><BrandLogo size="compact" /><span>WRX<span>GENERATOR</span></span></Link>
        <a className="ow-header-workshop" href="#smart-link">L’atelier <span>↘</span></a>
        <nav aria-label="Compte WRX"><Link className="ow-login" to="/login">Se connecter</Link><Link className="ow-header-cta" to="/register">Créer mon espace <ArrowUpRight size={16} aria-hidden="true" /></Link></nav>
      </header>
      <main id="ow-main">
        <div className="ow-surface" ref={surfaceRef}>
          <section className="ow-opening" aria-labelledby="ow-title">
            <div className="ow-surface-index"><span className="ow-origin" /> L’ATELIER NUMÉRIQUE<span>EXEMPLES DE CRÉATION WRX</span></div>
            <h1 id="ow-title">Faites-en<br />quelque chose<span>.</span></h1>
            <div className="ow-opening-copy"><p>Une adresse. Une identité.<br />Des supports prêts à servir.</p><Link className="ow-primary-cta" to="/register">Créer mon espace WRX <ArrowUpRight size={19} aria-hidden="true" /></Link><span>CRÉER / PARTAGER / METTRE EN USAGE</span></div>
            <WorkshopArtifacts />
            <a className="ow-scroll-cue" href="#smart-link"><ArrowDown size={15} aria-hidden="true" /> Entrez dans l’atelier</a>
            <span className="ow-registration ow-registration-tl" aria-hidden="true" /><span className="ow-registration ow-registration-br" aria-hidden="true" />
          </section>
          <SmartLinkInstrument />
        </div>
      </main>
    </div>
  );
}
