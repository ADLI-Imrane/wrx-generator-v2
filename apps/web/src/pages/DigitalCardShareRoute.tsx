import { Link, useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useDigitalCard } from '../hooks/useDigitalCards';
import { getDigitalCardSharingTarget } from '../lib/digital-card-sharing';

/** Phase 5B authenticated route boundary; the actual Share Mode surface is Phase 5C. */
export function DigitalCardShareRoute() {
  const { id = '' } = useParams();
  const card = useDigitalCard(id);

  if (card.isLoading) {
    return <div className="dc-state" role="status">Chargement de votre carte…</div>;
  }

  if (card.isError || !card.data) {
    return (
      <main className="tool-page digital-card-library">
        <section className="dc-state dc-state-error" role="alert">
          <p>Cette carte est introuvable ou vous n’y avez pas accès.</p>
          <button className="dc-text-button" type="button" onClick={() => void card.refetch()}>
            <RefreshCw size={14} /> Réessayer
          </button>
          <Link className="dc-text-button" to="/digital-cards">Retour aux cartes numériques</Link>
        </section>
      </main>
    );
  }

  const target = getDigitalCardSharingTarget(card.data);
  if (!target) {
    return (
      <main className="tool-page digital-card-library">
        <section className="dc-state" role="status">
          <p>Cette carte doit être publiée avant de pouvoir être partagée.</p>
          <Link className="dc-text-button" to={`/digital-cards/${card.data.id}/edit`}>
            Ouvrir le brouillon
          </Link>
          <Link className="dc-text-button" to="/digital-cards">Retour aux cartes numériques</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="tool-page digital-card-library">
      <header className="dc-page-heading">
        <div>
          <span className="dc-kicker">IDENTITÉ · PARTAGE</span>
          <h1>Mode de partage<span>.</span></h1>
          <p>{card.data.document.identity.fullName || card.data.title}</p>
        </div>
      </header>
      <section className="dc-state" aria-live="polite">
        <p>La présentation de partage et son QR seront disponibles ici prochainement.</p>
        <Link className="dc-text-button" to={`/c/${encodeURIComponent(card.data.slug)}`}>
          Ouvrir la carte publique
        </Link>
        <Link className="dc-text-button" to="/digital-cards">Retour aux cartes numériques</Link>
      </section>
    </main>
  );
}
