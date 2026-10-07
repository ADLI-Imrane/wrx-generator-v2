import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ContactRound, Globe2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { DigitalCardRecord } from '@wrx/shared';
import { Modal } from '../components/Modal';
import {
  useDeleteDigitalCard,
  useDigitalCards,
  usePublishDigitalCard,
  useUnpublishDigitalCard,
} from '../hooks/useDigitalCards';
import '../styles/digital-cards.css';

type PendingAction = {
  type: 'delete' | 'publish' | 'unpublish';
  card: DigitalCardRecord;
} | null;

export function DigitalCardsPage() {
  const cards = useDigitalCards();
  const remove = useDeleteDigitalCard();
  const publish = usePublishDigitalCard();
  const unpublish = useUnpublishDigitalCard();
  const [pending, setPending] = useState<PendingAction>(null);
  const [actionError, setActionError] = useState('');
  const busy = remove.isPending || publish.isPending || unpublish.isPending;

  const confirm = async () => {
    if (!pending) return;
    setActionError('');
    try {
      if (pending.type === 'delete') await remove.mutateAsync(pending.card.id);
      if (pending.type === 'publish') await publish.mutateAsync({ id: pending.card.id });
      if (pending.type === 'unpublish') await unpublish.mutateAsync({ id: pending.card.id });
      setPending(null);
    } catch (error) {
      setActionError(
        readableApiError(
          error,
          'Cette action n’a pas abouti. Vérifiez les informations et réessayez.'
        )
      );
    }
  };

  return (
    <div className="tool-page digital-card-library">
      <header className="dc-page-heading">
        <div>
          <span className="dc-kicker">IDENTITÉ · PARTAGE</span>
          <h1>
            Cartes numériques<span>.</span>
          </h1>
          <p>Des identités professionnelles prêtes à circuler, sous votre contrôle.</p>
        </div>
        <Link to="/digital-cards/new" className="btn btn-primary">
          <Plus size={17} /> Nouvelle carte
        </Link>
      </header>

      {cards.isLoading && (
        <div className="dc-state" role="status">
          Chargement de vos cartes numériques…
        </div>
      )}
      {cards.isError && (
        <div className="dc-state dc-state-error" role="alert">
          <p>Impossible de charger vos cartes numériques.</p>
          <button className="dc-text-button" onClick={() => void cards.refetch()}>
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      )}
      {!cards.isLoading && !cards.isError && cards.data?.length === 0 && (
        <section className="dc-empty">
          <div className="dc-empty-mark" aria-hidden="true">
            <ContactRound size={23} />
          </div>
          <span className="dc-kicker">VOTRE IDENTITÉ, EN LIGNE</span>
          <h2>Une présence professionnelle, à votre façon.</h2>
          <p>
            Créez une carte numérique indépendante de votre profil, choisissez ce qui sera visible,
            puis publiez-la lorsque vous êtes prêt.
          </p>
          <Link to="/digital-cards/new" className="btn btn-primary">
            Créer ma carte <ArrowUpRight size={16} />
          </Link>
        </section>
      )}

      {!cards.isLoading && !cards.isError && Boolean(cards.data?.length) && (
        <div className="dc-library-list">
          {cards.data?.map((card, index) => (
            <article className="dc-library-row" key={card.id}>
              <div className="dc-list-index">{String(index + 1).padStart(2, '0')}</div>
              <div
                className={`dc-list-monogram dc-list-${card.document.presentation.style}`}
                style={
                  {
                    '--dc-primary': card.document.brand.primaryColor,
                  } as React.CSSProperties
                }
                aria-hidden="true"
              >
                {card.document.identity.fullName
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase() || '—'}
              </div>
              <div className="dc-list-copy">
                <div className="dc-card-title-line">
                  <h2>{card.document.identity.fullName || 'Identité sans nom'}</h2>
                  <span className={`dc-status dc-status-${card.status}`}>
                    {card.status === 'published' ? (
                      <>
                        <Globe2 size={12} /> Publiée
                      </>
                    ) : (
                      'Brouillon'
                    )}
                  </span>
                </div>
                <p>
                  {[card.document.identity.jobTitle, card.document.identity.company]
                    .filter(Boolean)
                    .join(' · ') || card.title}
                </p>
                <small>
                  {card.title} · Modifiée le {new Date(card.updatedAt).toLocaleDateString('fr-FR')}
                </small>
                {card.status === 'published' && (
                  <code className="dc-public-address">
                    {window.location.origin}/c/{card.slug}{' '}
                    <span>· page publique en préparation</span>
                  </code>
                )}
              </div>
              <div className="dc-row-actions">
                <Link className="dc-text-button" to={`/digital-cards/${card.id}/edit`}>
                  Modifier <ArrowUpRight size={14} />
                </Link>
                <button
                  className="dc-text-button"
                  type="button"
                  onClick={() => {
                    setActionError('');
                    setPending({
                      type: card.status === 'published' ? 'unpublish' : 'publish',
                      card,
                    });
                  }}
                >
                  {card.status === 'published' ? 'Dépublier' : 'Publier'}
                </button>
                <button
                  className="dc-icon-button"
                  type="button"
                  aria-label={`Supprimer ${card.title}`}
                  onClick={() => {
                    setActionError('');
                    setPending({ type: 'delete', card });
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!pending}
        onClose={() => !busy && setPending(null)}
        title={
          pending?.type === 'delete'
            ? 'Supprimer cette carte ?'
            : pending?.type === 'publish'
              ? 'Publier cette carte ?'
              : 'Dépublier cette carte ?'
        }
        size="md"
      >
        {pending?.type === 'delete' ? (
          <p className="text-sm text-gray-600">
            « {pending.card.title} » sera supprimée de votre espace. Cette action est définitive.
          </p>
        ) : pending?.type === 'publish' ? (
          <div className="dc-publish-warning">
            <p>
              Les informations sélectionnées et leurs images deviendront accessibles publiquement
              sur une adresse stable.
            </p>
            <ul>
              {publicFieldSummary(pending?.card).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="dc-phase-note">
              La page publique sera activée dans une prochaine étape. Vous pourrez dépublier cette
              carte à tout moment.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Cette carte ne sera plus accessible publiquement. Elle restera enregistrée en brouillon.
          </p>
        )}
        {actionError && (
          <p className="dc-form-error" role="alert">
            {actionError}
          </p>
        )}
        <div className="dc-modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy}
            onClick={() => setPending(null)}
          >
            Annuler
          </button>
          <button
            type="button"
            className={`btn ${pending?.type === 'delete' ? 'dc-danger' : 'btn-primary'}`}
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy
              ? 'Patientez…'
              : pending?.type === 'delete'
                ? 'Supprimer'
                : pending?.type === 'publish'
                  ? 'Publier'
                  : 'Dépublier'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function publicFieldSummary(card: DigitalCardRecord | undefined) {
  if (!card) return [];
  const { document } = card;
  const entries: [keyof typeof document.visibility, string][] = [
    ['fullName', 'Nom'],
    ['jobTitle', 'Fonction'],
    ['company', 'Entreprise'],
    ['avatar', 'Photo'],
    ['companyLogo', 'Logo'],
    ['email', 'Email'],
    ['phone', 'Téléphone'],
    ['website', 'Site web'],
    ['address', 'Adresse'],
    ['linkedin', 'LinkedIn'],
    ['github', 'GitHub'],
    ['instagram', 'Instagram'],
    ['x', 'X'],
  ];
  return entries
    .filter(([key]) => document.visibility[key])
    .filter(([key]) => {
      if (key === 'fullName') return Boolean(document.identity.fullName);
      if (key === 'jobTitle') return Boolean(document.identity.jobTitle);
      if (key === 'company') return Boolean(document.identity.company);
      if (key === 'avatar') return Boolean(document.identity.avatarPath);
      if (key === 'companyLogo') return Boolean(document.identity.companyLogoPath);
      if (key === 'email') return Boolean(document.contact.email);
      if (key === 'phone') return Boolean(document.contact.phone);
      if (key === 'website') return Boolean(document.contact.website);
      if (key === 'address') return Boolean(document.contact.address);
      return Boolean(document.socialLinks[key as 'linkedin' | 'github' | 'instagram' | 'x']);
    })
    .map(([, label]) => label);
}

function readableApiError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const jsonStart = error.message.indexOf(': {');
  if (jsonStart >= 0) {
    try {
      const payload = JSON.parse(error.message.slice(jsonStart + 2)) as {
        message?: string | string[];
      };
      if (typeof payload.message === 'string') return payload.message;
      if (Array.isArray(payload.message)) return payload.message.join(' ');
    } catch {
      /* Use fallback for non-JSON errors. */
    }
  }
  return fallback;
}
