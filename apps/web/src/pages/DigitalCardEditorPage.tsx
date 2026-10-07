import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, Save, ShieldCheck } from 'lucide-react';
import {
  DIGITAL_CARD_SOCIAL_PLATFORMS,
  assertDigitalCardPublishable,
  normalizeDigitalCardTitle,
  parseDigitalCardDocument,
  type DigitalCardDocumentV1,
} from '@wrx/shared';
import { Modal } from '../components/Modal';
import { DigitalCardPreview } from '../components/DigitalCardPreview';
import { useProfile } from '../hooks/useAuth';
import { useBusinessCards } from '../hooks/useBusinessCards';
import { useAuthStore } from '../stores/auth.store';
import {
  useCreateDigitalCard,
  useDigitalCard,
  usePublishDigitalCard,
  useUnpublishDigitalCard,
  useUpdateDigitalCard,
} from '../hooks/useDigitalCards';
import {
  blankDigitalCardDocument,
  digitalCardFromBusinessCard,
  digitalCardFromProfile,
} from '../lib/digital-card-mapping';
import '../styles/digital-cards.css';

const socialLabels = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  instagram: 'Instagram',
  x: 'X / Twitter',
} as const;
type StartSource = 'profile' | 'physical' | 'blank';

export function DigitalCardEditorPage() {
  const { id = '' } = useParams<{ id: string }>();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const profile = useProfile();
  const physicalCards = useBusinessCards();
  const cardQuery = useDigitalCard(id);
  const create = useCreateDigitalCard();
  const update = useUpdateDigitalCard();
  const publish = usePublishDigitalCard();
  const unpublish = useUnpublishDigitalCard();
  const [title, setTitle] = useState('Carte numérique');
  const [document, setDocument] = useState<DigitalCardDocumentV1>(blankDigitalCardDocument);
  const [source, setSource] = useState<StartSource | null>(null);
  const [initializing, setInitializing] = useState(editing);
  const [hydratedCardId, setHydratedCardId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [notice, setNotice] = useState('');
  const saving = create.isPending || update.isPending;
  const sourceLabel = useMemo(
    () =>
      source === 'profile'
        ? 'instantané du profil'
        : source === 'physical'
          ? 'copie d’une carte physique'
          : 'nouvelle identité',
    [source]
  );

  useEffect(() => {
    if (editing) {
      setInitializing(true);
      setHydratedCardId(null);
      setTitle('Carte numérique');
      setDocument(blankDigitalCardDocument());
      setSource(null);
      setError('');
      setNotice('');
    } else {
      setInitializing(false);
      setTitle('Carte numérique');
      setDocument(blankDigitalCardDocument());
      setSource(null);
      setError('');
      setNotice('');
    }
  }, [id, editing]);

  useEffect(() => {
    if (!editing || !cardQuery.data || cardQuery.data.id !== id) return;
    setTitle(cardQuery.data.title);
    setDocument(parseDigitalCardDocument(cardQuery.data.document));
    setSource('blank');
    setInitializing(false);
    setHydratedCardId(cardQuery.data.id);
    setError('');
  }, [editing, id, cardQuery.data]);

  const chooseProfile = () => {
    setDocument(digitalCardFromProfile(profile.data, user?.id, user?.email));
    setTitle(
      profile.data?.company ? `${profile.data.company} · carte numérique` : 'Carte numérique'
    );
    setSource('profile');
    setError('');
  };
  const chooseBlank = () => {
    setDocument(blankDigitalCardDocument());
    setTitle('Carte numérique');
    setSource('blank');
    setError('');
  };
  const choosePhysical = (cardId: string) => {
    const card = physicalCards.data?.find((item) => item.id === cardId);
    if (!card) return;
    setDocument(digitalCardFromBusinessCard(card.document));
    setTitle(card.title ? `${card.title} · numérique` : 'Carte numérique');
    setSource('physical');
    setError('');
  };

  const setIdentity = (key: keyof DigitalCardDocumentV1['identity'], value: string | null) =>
    setDocument((current) => ({
      ...current,
      identity: { ...current.identity, [key]: value },
    }));
  const setContact = (key: keyof DigitalCardDocumentV1['contact'], value: string | null) =>
    setDocument((current) => ({
      ...current,
      contact: { ...current.contact, [key]: value },
    }));
  const setVisibility = (key: keyof DigitalCardDocumentV1['visibility'], value: boolean) =>
    setDocument((current) => ({
      ...current,
      visibility: { ...current.visibility, [key]: value },
    }));

  const save = async () => {
    const normalized = parseDigitalCardDocument(document);
    const normalizedTitle = normalizeDigitalCardTitle(title);
    if (editing)
      return update.mutateAsync({
        id,
        input: { title: normalizedTitle, document: normalized },
      });
    return create.mutateAsync({ title: normalizedTitle, document: normalized });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const result = await save();
      if (!editing) navigate(`/digital-cards/${result.id}/edit`, { replace: true });
      else setNotice('Modifications enregistrées.');
    } catch (cause) {
      setError(
        readableApiError(cause, 'Enregistrement impossible. Vérifiez les champs et réessayez.')
      );
    }
  };

  const confirmPublish = async () => {
    setPublishError('');
    try {
      assertDigitalCardPublishable(parseDigitalCardDocument(document));
      const saved = await save();
      if (!editing) {
        navigate(`/digital-cards/${saved.id}/edit`, { replace: true });
        await publish.mutateAsync({ id: saved.id });
        setPublishOpen(false);
        setNotice('Carte publiée. La page publique sera disponible dans la prochaine étape.');
        return;
      }
      await publish.mutateAsync({ id });
      setPublishOpen(false);
      setNotice('Carte publiée. La page publique sera disponible dans la prochaine étape.');
    } catch (cause) {
      setPublishError(
        readableApiError(
          cause,
          'Publication impossible. Ajoutez un nom visible et au moins un moyen de contact visible.'
        )
      );
    }
  };

  const confirmUnpublish = async () => {
    if (!editing) return;
    setPublishError('');
    try {
      await unpublish.mutateAsync({ id });
      setUnpublishOpen(false);
      setNotice('Carte dépubliée. Elle reste enregistrée en brouillon.');
    } catch (cause) {
      setPublishError(readableApiError(cause, 'Impossible de dépublier cette carte. Réessayez.'));
    }
  };

  if (editing && cardQuery.isError)
    return (
      <div className="dc-state dc-state-error" role="alert">
        <h1>Carte numérique introuvable</h1>
        <p>Cette carte n’existe pas ou vous n’y avez pas accès.</p>
        <Link className="btn btn-outline" to="/digital-cards">
          Retour aux cartes
        </Link>
      </div>
    );
  if (
    editing &&
    (initializing ||
      cardQuery.isLoading ||
      !cardQuery.data ||
      cardQuery.data.id !== id ||
      hydratedCardId !== id)
  )
    return (
      <div className="dc-state" role="status">
        Chargement de votre carte…
      </div>
    );
  return (
    <div className="tool-page digital-card-editor">
      <header className="dc-editor-heading">
        <div>
          <Link to="/digital-cards" className="dc-back-link">
            <ArrowLeft size={15} /> Mes cartes numériques
          </Link>
          <span className="dc-kicker">
            IDENTITÉ NUMÉRIQUE · {editing ? 'ÉDITION' : 'NOUVELLE CARTE'}
          </span>
          <h1>
            {editing ? 'Ajuster votre identité' : 'Composer votre carte'}
            <span>.</span>
          </h1>
          <p>Une copie indépendante : vos changements ici ne modifient pas votre profil.</p>
        </div>
        {editing && (
          <span className={`dc-status dc-status-${cardQuery.data?.status}`}>
            {cardQuery.data?.status === 'published' ? 'Publiée' : 'Brouillon'}
          </span>
        )}
      </header>

      {!editing && !source && (
        <section className="dc-start-panel" aria-labelledby="dc-start-title">
          <div>
            <span className="dc-kicker">POINT DE DÉPART</span>
            <h2 id="dc-start-title">Quelle identité souhaitez-vous reprendre ?</h2>
            <p>La source est copiée une seule fois. Votre carte évolue ensuite séparément.</p>
          </div>
          <div className="dc-start-options">
            <button type="button" disabled={profile.isLoading} onClick={chooseProfile}>
              <strong>{profile.isLoading ? 'Chargement du profil…' : 'Partir du profil'}</strong>
              <span>Reprendre vos coordonnées et votre signature de marque.</span>
            </button>
            <div className="dc-physical-choice">
              <label htmlFor="dc-physical-source">Copier une carte de visite physique</label>
              <select
                id="dc-physical-source"
                disabled={physicalCards.isLoading || !physicalCards.data?.length}
                defaultValue=""
                onChange={(event) => choosePhysical(event.target.value)}
              >
                <option value="">
                  {physicalCards.isLoading
                    ? 'Chargement des cartes…'
                    : physicalCards.data?.length
                      ? 'Choisir une carte enregistrée…'
                      : 'Aucune carte physique disponible'}
                </option>
                {physicalCards.data?.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.title} · {card.document.identity.fullName || 'Sans nom'}
                  </option>
                ))}
              </select>
              {physicalCards.isError && (
                <small role="status">
                  Les cartes physiques n’ont pas pu être chargées.{' '}
                  <button
                    type="button"
                    className="dc-text-button"
                    onClick={() => void physicalCards.refetch()}
                  >
                    Réessayer
                  </button>
                </small>
              )}
            </div>
            <button type="button" onClick={chooseBlank}>
              <strong>Commencer sans données</strong>
              <span>Créer une identité vide et tout saisir manuellement.</span>
            </button>
          </div>
          {profile.isError && (
            <p className="dc-help-note" role="status">
              Profil indisponible. Vous pouvez réessayer plus tard ou continuer sans préremplissage.
            </p>
          )}
        </section>
      )}

      {(editing || source) && (
        <>
          {!editing && source && (
            <p className="dc-source-note">
              <Check size={14} /> Données copiées depuis {sourceLabel}. Elles ne sont pas liées à
              leur source.
            </p>
          )}
          <div className="dc-editor-layout">
            <form className="dc-editor-form" noValidate onSubmit={(event) => void submit(event)}>
              {error && (
                <div className="dc-form-error" role="alert">
                  {error}
                </div>
              )}
              {notice && (
                <p className="dc-success" role="status">
                  {notice}
                </p>
              )}
              <section className="dc-form-section">
                <div className="dc-section-heading">
                  <span>01</span>
                  <div>
                    <h2>Cette carte</h2>
                    <p>Nom privé pour la retrouver dans votre espace.</p>
                  </div>
                </div>
                <Field label="Nom interne">
                  <input
                    value={title}
                    maxLength={100}
                    required
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </Field>
              </section>
              <section className="dc-form-section">
                <div className="dc-section-heading">
                  <span>02</span>
                  <div>
                    <h2>Identité</h2>
                    <p>Le nom et le contexte professionnel.</p>
                  </div>
                </div>
                <div className="dc-fields-grid">
                  <Field label="Nom complet">
                    <input
                      autoComplete="name"
                      maxLength={150}
                      value={document.identity.fullName}
                      onChange={(event) => setIdentity('fullName', event.target.value)}
                    />
                  </Field>
                  <Field label="Fonction">
                    <input
                      autoComplete="organization-title"
                      maxLength={120}
                      value={document.identity.jobTitle || ''}
                      onChange={(event) => setIdentity('jobTitle', event.target.value || null)}
                    />
                  </Field>
                  <Field label="Entreprise">
                    <input
                      autoComplete="organization"
                      maxLength={150}
                      value={document.identity.company || ''}
                      onChange={(event) => setIdentity('company', event.target.value || null)}
                    />
                  </Field>
                </div>
                <div className="dc-visibility-grid">
                  <Visibility
                    label="Nom visible"
                    checked={document.visibility.fullName}
                    onChange={(value) => setVisibility('fullName', value)}
                  />
                  <Visibility
                    label="Fonction visible"
                    checked={document.visibility.jobTitle}
                    onChange={(value) => setVisibility('jobTitle', value)}
                  />
                  <Visibility
                    label="Entreprise visible"
                    checked={document.visibility.company}
                    onChange={(value) => setVisibility('company', value)}
                  />
                </div>
              </section>

              <section className="dc-form-section">
                <div className="dc-section-heading">
                  <span>03</span>
                  <div>
                    <h2>Coordonnées</h2>
                    <p>Choisissez précisément ce qui sera public.</p>
                  </div>
                </div>
                <div className="dc-fields-grid">
                  <Field label="Email">
                    <input
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      value={document.contact.email || ''}
                      onChange={(event) => setContact('email', event.target.value || null)}
                    />
                  </Field>
                  <Field label="Téléphone">
                    <input
                      type="tel"
                      autoComplete="tel"
                      maxLength={32}
                      value={document.contact.phone || ''}
                      onChange={(event) => setContact('phone', event.target.value || null)}
                    />
                  </Field>
                  <Field label="Site web">
                    <input
                      type="url"
                      inputMode="url"
                      autoCapitalize="none"
                      placeholder="https://exemple.com"
                      value={document.contact.website || ''}
                      onChange={(event) => setContact('website', event.target.value || null)}
                    />
                  </Field>
                  <Field label="Adresse">
                    <textarea
                      rows={2}
                      maxLength={300}
                      autoComplete="street-address"
                      value={document.contact.address || ''}
                      onChange={(event) => setContact('address', event.target.value || null)}
                    />
                  </Field>
                </div>
                <div className="dc-visibility-grid">
                  {(['email', 'phone', 'website', 'address'] as const).map((key) => (
                    <Visibility
                      key={key}
                      label={`${fieldLabels[key]} visible`}
                      checked={document.visibility[key]}
                      onChange={(value) => setVisibility(key, value)}
                    />
                  ))}
                </div>
              </section>

              <section className="dc-form-section">
                <div className="dc-section-heading">
                  <span>04</span>
                  <div>
                    <h2>Réseaux</h2>
                    <p>Ajoutez les profils pertinents, puis choisissez leur visibilité.</p>
                  </div>
                </div>
                <div className="dc-fields-grid">
                  {DIGITAL_CARD_SOCIAL_PLATFORMS.map((key) => (
                    <Field key={key} label={socialLabels[key]}>
                      <input
                        type="url"
                        inputMode="url"
                        autoCapitalize="none"
                        placeholder={socialPlaceholders[key]}
                        value={document.socialLinks[key] || ''}
                        onChange={(event) =>
                          setDocument((current) => {
                            const next = { ...current.socialLinks };
                            if (event.target.value) next[key] = event.target.value;
                            else delete next[key];
                            return { ...current, socialLinks: next };
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>
                <div className="dc-visibility-grid">
                  {DIGITAL_CARD_SOCIAL_PLATFORMS.map((key) => (
                    <Visibility
                      key={key}
                      label={`${socialLabels[key]} visible`}
                      checked={document.visibility[key]}
                      onChange={(value) => setVisibility(key, value)}
                    />
                  ))}
                </div>
              </section>

              <section className="dc-form-section">
                <div className="dc-section-heading">
                  <span>05</span>
                  <div>
                    <h2>Signature visuelle</h2>
                    <p>Images privées et accents de marque.</p>
                  </div>
                </div>
                <div className="dc-asset-options">
                  <AssetVisibility
                    label="Photo de profil"
                    path={document.identity.avatarPath}
                    visible={document.visibility.avatar}
                    onChange={(value) => setVisibility('avatar', value)}
                    onClear={() => setIdentity('avatarPath', null)}
                  />
                  <AssetVisibility
                    label="Logo d’entreprise"
                    path={document.identity.companyLogoPath}
                    visible={document.visibility.companyLogo}
                    onChange={(value) => setVisibility('companyLogo', value)}
                    onClear={() => setIdentity('companyLogoPath', null)}
                  />
                </div>
                <div className="dc-fields-grid dc-color-grid">
                  <ColorField
                    label="Couleur principale"
                    value={document.brand.primaryColor}
                    onChange={(value) =>
                      setDocument((current) => ({
                        ...current,
                        brand: { ...current.brand, primaryColor: value },
                      }))
                    }
                  />
                  <Field label="Couleur secondaire">
                    <div className="dc-color-field">
                      <input
                        aria-label="Couleur secondaire"
                        type="color"
                        value={document.brand.secondaryColor || document.brand.primaryColor}
                        onChange={(event) =>
                          setDocument((current) => ({
                            ...current,
                            brand: {
                              ...current.brand,
                              secondaryColor: event.target.value.toUpperCase(),
                            },
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="dc-text-button"
                        onClick={() =>
                          setDocument((current) => ({
                            ...current,
                            brand: { ...current.brand, secondaryColor: null },
                          }))
                        }
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </Field>
                </div>
                <Field label="Présentation">
                  <select
                    value={document.presentation.style}
                    onChange={(event) =>
                      setDocument((current) => ({
                        ...current,
                        presentation: {
                          style: event.target.value as 'light' | 'dark',
                        },
                      }))
                    }
                  >
                    <option value="light">Clair · neutre</option>
                    <option value="dark">Sombre · graphite</option>
                  </select>
                </Field>
                <p className="dc-help-note">
                  <ShieldCheck size={15} /> Les images restent dans le stockage privé WRX. Les liens
                  temporaires ne sont jamais enregistrés dans la carte.
                </p>
              </section>

              <div className="dc-save-row">
                <Link className="dc-text-button" to="/digital-cards">
                  Annuler
                </Link>
                <div>
                  {!editing && (
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={saving || publish.isPending}
                      onClick={() => {
                        setPublishError('');
                        setPublishOpen(true);
                      }}
                    >
                      Enregistrer et publier…
                    </button>
                  )}
                  {editing && cardQuery.data?.status === 'draft' && (
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={saving || publish.isPending}
                      onClick={() => {
                        setPublishError('');
                        setPublishOpen(true);
                      }}
                    >
                      Publier…
                    </button>
                  )}
                  {editing && cardQuery.data?.status === 'published' && (
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={saving || unpublish.isPending}
                      onClick={() => {
                        setPublishError('');
                        setUnpublishOpen(true);
                      }}
                    >
                      Dépublier…
                    </button>
                  )}
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? <LoaderCircle className="dc-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </form>
            <aside className="dc-preview-sticky">
              <div className="dc-preview-label">
                <span className="dc-kicker">APERÇU MOBILE</span>
                <span>
                  <Eye size={13} /> Champs visibles uniquement
                </span>
              </div>
              <DigitalCardPreview document={document} title={title} />
              <p className="dc-preview-caption">
                La page publique et l’action Enregistrer le contact seront disponibles en Phase 3D.
              </p>
            </aside>
          </div>
        </>
      )}

      <Modal
        isOpen={publishOpen}
        onClose={() => !publish.isPending && setPublishOpen(false)}
        title="Publier votre carte numérique ?"
      >
        <div className="dc-publish-warning">
          <p>
            Les informations et images sélectionnées comme visibles seront accessibles publiquement
            sur une adresse stable.
          </p>
          <ul>
            {visibleFieldNames(document).map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <p className="dc-phase-note">
            La page publique arrive en Phase 3D. Vous pourrez dépublier à tout moment.
          </p>
        </div>
        {publishError && (
          <p className="dc-form-error" role="alert">
            {publishError}
          </p>
        )}
        <div className="dc-modal-actions">
          <button
            className="btn btn-outline"
            type="button"
            disabled={publish.isPending}
            onClick={() => setPublishOpen(false)}
          >
            Annuler
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={publish.isPending}
            onClick={() => void confirmPublish()}
          >
            {publish.isPending ? 'Publication…' : 'Confirmer la publication'}
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={unpublishOpen}
        onClose={() => !unpublish.isPending && setUnpublishOpen(false)}
        title="Dépublier cette carte ?"
      >
        <p className="text-sm text-gray-600">
          La carte ne sera plus accessible publiquement. Son contenu restera enregistré dans votre
          espace.
        </p>
        {publishError && (
          <p className="dc-form-error" role="alert">
            {publishError}
          </p>
        )}
        <div className="dc-modal-actions">
          <button
            className="btn btn-outline"
            type="button"
            disabled={unpublish.isPending}
            onClick={() => setUnpublishOpen(false)}
          >
            Annuler
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={unpublish.isPending}
            onClick={() => void confirmUnpublish()}
          >
            {unpublish.isPending ? 'Dépublication…' : 'Confirmer la dépublication'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

const fieldLabels = {
  email: 'Email',
  phone: 'Téléphone',
  website: 'Site web',
  address: 'Adresse',
} as const;
const socialPlaceholders = {
  linkedin: 'https://linkedin.com/in/…',
  github: 'https://github.com/…',
  instagram: 'https://instagram.com/…',
  x: 'https://x.com/…',
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="dc-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Visibility({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="dc-visibility">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span aria-hidden="true">{checked ? <Eye size={13} /> : <EyeOff size={13} />}</span>
      {label}
    </label>
  );
}
function AssetVisibility({
  label,
  path,
  visible,
  onChange,
  onClear,
}: {
  label: string;
  path: string | null;
  visible: boolean;
  onChange: (value: boolean) => void;
  onClear: () => void;
}) {
  return (
    <div className="dc-asset-row">
      <Visibility label={label} checked={visible} onChange={onChange} />
      <span>{path ? 'Image du profil WRX · privée' : 'Aucune image reprise'}</span>
      {path && (
        <button type="button" className="dc-text-button" onClick={onClear}>
          Retirer
        </button>
      )}
    </div>
  );
}
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="dc-color-field">
        <input
          aria-label={label}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <code>{value}</code>
      </div>
    </Field>
  );
}
function visibleFieldNames(document: DigitalCardDocumentV1) {
  const fields: [keyof DigitalCardDocumentV1['visibility'], string, boolean][] = [
    ['fullName', 'Nom', !!document.identity.fullName],
    ['jobTitle', 'Fonction', !!document.identity.jobTitle],
    ['company', 'Entreprise', !!document.identity.company],
    ['avatar', 'Photo de profil', !!document.identity.avatarPath],
    ['companyLogo', 'Logo d’entreprise', !!document.identity.companyLogoPath],
    ['email', 'Email', !!document.contact.email],
    ['phone', 'Téléphone', !!document.contact.phone],
    ['website', 'Site web', !!document.contact.website],
    ['address', 'Adresse', !!document.contact.address],
    ...DIGITAL_CARD_SOCIAL_PLATFORMS.map(
      (key) =>
        [key, socialLabels[key], Boolean(document.socialLinks[key])] as [
          keyof DigitalCardDocumentV1['visibility'],
          string,
          boolean,
        ]
    ),
  ];
  return fields
    .filter(([key, , hasValue]) => document.visibility[key] && hasValue)
    .map(([, label]) => label);
}
function readableApiError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.name === 'DigitalCardDocumentValidationError') return error.message;
  const jsonStart = error.message.indexOf(': {');
  if (jsonStart >= 0)
    try {
      const data = JSON.parse(error.message.slice(jsonStart + 2)) as {
        message?: string | string[];
      };
      if (typeof data.message === 'string') return data.message;
      if (Array.isArray(data.message)) return data.message.join(' ');
    } catch {
      /* fallback */
    }
  return fallback;
}
