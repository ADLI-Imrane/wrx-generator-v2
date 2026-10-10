import { BarChart3, ContactRound, KeyRound, Link2, PenLine, QrCode, UserRound } from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';

export function WorkspaceScene() {
  return (
    <section className="wrx-scene wrx-workspace" id="workspace" aria-labelledby="workspace-title" data-scene="workspace">
      <div className="wrx-workspace-heading">
        <div><p className="wrx-kicker">07 / RASSEMBLER</p><h2 id="workspace-title">Votre espace.<br /><em>Vos outils.</em></h2></div>
        <p>Un même atelier pour créer, relier et gérer vos supports numériques.</p>
      </div>

      <div className="wrx-workspace-preview" aria-label="Représentation illustrative de l’espace de travail WRX">
        <div className="wrx-workspace-bar"><BrandLogo size="landing" /><span>WRX <small>GENERATOR</small></span><i>ESPACE DE TRAVAIL</i><b><span /><span /><span /></b></div>
        <div className="wrx-workspace-body">
          <div className="wrx-tool-rail" role="group" aria-label="Outils WRX illustrés">
            <p className="wrx-tool-label">OUTILS</p>
            <span className="wrx-tool-active"><Link2 size={14} aria-hidden="true" />Liens</span>
            <span><QrCode size={14} aria-hidden="true" />QR Codes</span>
            <span><ContactRound size={14} aria-hidden="true" />Cartes de visite</span>
            <span><UserRound size={14} aria-hidden="true" />Cartes numériques</span>
            <span><PenLine size={14} aria-hidden="true" />Signatures email</span>
            <span><BarChart3 size={14} aria-hidden="true" />Analytics</span>
            <span><KeyRound size={14} aria-hidden="true" />Mots de passe</span>
          </div>
          <div className="wrx-workspace-content">
            <div className="wrx-workspace-content-head"><span className="wrx-workspace-index">ESPACE / VOS OUTILS</span><span>APERÇU ILLUSTRATIF</span></div>
            <h3>Créer. Relier.<br />Mettre en usage.</h3>
            <div className="wrx-workflow-list">
              <div className="wrx-workflow-row"><span className="wrx-workspace-index">01</span><div><strong>Partager une destination</strong><small>Liens WRX · QR gérés · clics</small></div><span aria-hidden="true">↗</span></div>
              <div className="wrx-workflow-row"><span className="wrx-workspace-index">02</span><div><strong>Donner forme à une identité</strong><small>Carte imprimée · QR statique · carte publiée</small></div><span aria-hidden="true">↗</span></div>
              <div className="wrx-workflow-row"><span className="wrx-workspace-index">03</span><div><strong>Prolonger sur d’autres supports</strong><small>Signatures email · copie modifiable à part</small></div><span aria-hidden="true">↗</span></div>
            </div>
            <div className="wrx-workspace-independent"><KeyRound size={15} aria-hidden="true" /><span><strong>Un outil indépendant</strong><small>Le générateur de mots de passe complète la boîte à outils, hors du parcours de partage.</small></span></div>
          </div>
        </div>
        <div className="wrx-workspace-preferences"><span>VOTRE ENVIRONNEMENT</span><i>NAVIGATION · LATÉRALE / DOCK / LANCEUR</i><i>ACCENT · 5 CHOIX</i><i>APPARENCE · CLAIR / SOMBRE / SYSTÈME</i></div>
      </div>
    </section>
  );
}
