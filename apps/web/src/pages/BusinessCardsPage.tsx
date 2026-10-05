import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ContactRound, Plus, Trash2 } from 'lucide-react';
import type { BusinessCardRecord } from '@wrx/shared';
import { Modal } from '../components/Modal';
import { BusinessCardPreview } from '../components/BusinessCardPreview';
import { businessCardTemplates } from '../components/businessCardPreview.data';
import { useBusinessCards, useDeleteBusinessCard } from '../hooks/useBusinessCards';
import '../styles/business-cards.css';

export function BusinessCardsPage() {
  const { data: cards = [], isLoading, isError, refetch } = useBusinessCards();
  const removeCard = useDeleteBusinessCard();
  const [pendingDelete, setPendingDelete] = useState<BusinessCardRecord | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await removeCard.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
      setDeleteError('');
    } catch {
      setDeleteError('La carte n’a pas pu être supprimée. Réessayez.');
    }
  };

  return (
    <div className="tool-page business-card-library">
      <header className="studio-page-heading">
        <div><span className="bc-overline">OUTIL 06 · IDENTITÉ PROFESSIONNELLE</span><h1>Cartes de visite<span>.</span></h1><p>Une identité claire, prête à être partagée.</p></div>
        <Link to="/business-cards/new" className="btn btn-primary bc-new-card"><Plus size={17} /> Nouvelle carte</Link>
      </header>

      {isLoading && <div className="bc-state" role="status">Chargement de vos cartes…</div>}
      {isError && <div className="bc-state bc-state-error" role="alert"><p>Impossible de charger vos cartes pour le moment.</p><button className="bc-text-button" onClick={() => void refetch()}>Réessayer</button></div>}
      {!isLoading && !isError && cards.length === 0 && (
        <section className="bc-empty-state">
          <div className="bc-empty-mark" aria-hidden="true"><ContactRound size={25} /></div>
          <p className="bc-overline">VOTRE PREMIÈRE CARTE</p>
          <h2>Votre identité, en format de poche.</h2>
          <p>Partez de votre profil WRX, choisissez une composition, puis ajustez les informations à afficher. La carte garde son propre instantané.</p>
          <Link to="/business-cards/new" className="btn btn-primary">Créer ma carte <ArrowUpRight size={16} /></Link>
        </section>
      )}

      {cards.length > 0 && !isLoading && !isError && (
        <div className="bc-library-grid">
          {cards.map((card) => {
            const template = businessCardTemplates.find((item) => item.key === card.templateKey);
            return <article className="bc-library-item" key={card.id}>
              <Link to={`/business-cards/${card.id}/edit`} className="bc-library-preview-link" aria-label={`Ouvrir ${card.title}`}>
                <BusinessCardPreview document={card.document} side="front" onSideChange={() => undefined} compact hideSideSwitch />
              </Link>
              <div className="bc-library-meta">
                <div><span className="bc-overline">{template?.name ?? card.templateKey}</span><h2>{card.title}</h2><p>{card.document.identity.fullName || 'Sans nom'}{card.document.identity.company ? ` · ${card.document.identity.company}` : ''}</p></div>
                <div className="bc-library-actions">
                  <Link to={`/business-cards/${card.id}/edit`} className="bc-text-button">Modifier <ArrowUpRight size={14} /></Link>
                  <button type="button" className="bc-icon-button" aria-label={`Supprimer ${card.title}`} onClick={() => { setDeleteError(''); setPendingDelete(card); }}><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="bc-updated">Modifiée le {new Date(card.updatedAt).toLocaleDateString('fr-FR')}</p>
            </article>;
          })}
        </div>
      )}

      <Modal isOpen={!!pendingDelete} onClose={() => !removeCard.isPending && setPendingDelete(null)} title="Supprimer cette carte ?" size="sm">
        <p className="text-sm text-gray-600">« {pendingDelete?.title} » sera supprimée de votre espace. Cette action est définitive.</p>
        {deleteError && <p className="bc-form-error mt-4" role="alert">{deleteError}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn btn-outline" disabled={removeCard.isPending} onClick={() => setPendingDelete(null)}>Annuler</button><button type="button" className="btn bc-delete-button" disabled={removeCard.isPending} onClick={() => void confirmDelete()}>{removeCard.isPending ? 'Suppression…' : 'Supprimer'}</button></div>
      </Modal>
    </div>
  );
}
