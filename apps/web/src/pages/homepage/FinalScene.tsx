import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FinalScene() {
  return (
    <section className="wrx-scene wrx-final-scene" aria-labelledby="final-title" data-scene="final">
      <div className="wrx-final-cta">
        <span className="wrx-final-signal" aria-hidden="true"><i /><i /><i /></span>
        <p className="wrx-kicker">CRÉER → PARTAGER → SÉCURISER → MESURER</p>
        <h2 id="final-title">Créez quelque chose<br /><em>qui circule.</em></h2>
        <p>Un espace pour vos outils numériques, réunis autour de ce que vous voulez mettre en usage.</p>
        <div className="wrx-home-hero-actions">
          <Link className="wrx-home-primary" to="/register">Créer mon espace WRX <ArrowUpRight size={18} aria-hidden="true" /></Link>
          <Link className="wrx-home-secondary" to="/login">Se connecter</Link>
        </div>
      </div>
    </section>
  );
}
