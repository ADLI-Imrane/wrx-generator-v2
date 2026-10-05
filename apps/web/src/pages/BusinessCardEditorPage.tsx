import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Eye, EyeOff, LoaderCircle, Save } from 'lucide-react';
import {
  BUSINESS_CARD_SCHEMA_VERSION,
  parseBusinessCardDocument,
  type BusinessCardDocument,
  type BusinessCardQrType,
  type BusinessCardSocialPlatform,
  type BusinessCardTemplateKey,
  type BusinessCardVisibility,
} from '@wrx/shared';
import { useProfile } from '../hooks/useAuth';
import { useAuthStore } from '../stores/auth.store';
import { useBusinessCard, useCreateBusinessCard, useUpdateBusinessCard } from '../hooks/useBusinessCards';
import { BusinessCardPreview } from '../components/BusinessCardPreview';
import { businessCardTemplates } from '../components/businessCardPreview.data';

const emptyVisibility: BusinessCardVisibility = {
  fullName: true, jobTitle: true, company: true, email: true, phone: true, website: true, address: true,
  linkedin: true, github: true, instagram: true, x: true, avatar: true, companyLogo: true, qr: true,
};

function blankDocument(): BusinessCardDocument {
  return {
    schemaVersion: BUSINESS_CARD_SCHEMA_VERSION,
    templateKey: 'classic',
    identity: { fullName: '', socialLinks: {}, avatarPath: null, companyLogoPath: null },
    visibility: { ...emptyVisibility },
    brand: { primaryColor: '#235EE7', secondaryColor: '#E7E9E1' },
    sides: { front: { composition: 'identity' }, back: { enabled: true, composition: 'contact' } },
  };
}

const socialFields: { key: BusinessCardSocialPlatform; label: string; placeholder: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/…' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/…' },
  { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/…' },
  { key: 'x', label: 'X / Twitter', placeholder: 'x.com/…' },
];

function urlInput(value: string | null | undefined, label: string, onChange: (value: string) => void, placeholder = 'exemple.com') {
  return <Field label={label}><input type="text" inputMode="url" autoCapitalize="none" value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></Field>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="bc-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function BusinessCardEditorPage() {
  const { id = '' } = useParams<{ id: string }>();
  const editing = !!id;
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const profileQuery = useProfile();
  const cardQuery = useBusinessCard(id);
  const createCard = useCreateBusinessCard();
  const updateCard = useUpdateBusinessCard();
  const [title, setTitle] = useState('Carte professionnelle');
  const [document, setDocument] = useState<BusinessCardDocument>(blankDocument);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [formError, setFormError] = useState('');
  const [isPrefilled, setIsPrefilled] = useState(false);
  const didInitialize = useRef(false);
  const isSaving = createCard.isPending || updateCard.isPending;
  const profileReady = profileQuery.isSuccess || profileQuery.isError;

  useEffect(() => {
    if (!editing || !cardQuery.data || didInitialize.current) return;
    const saved = cardQuery.data;
    setTitle(saved.title);
    setDocument(parseBusinessCardDocument(saved.document));
    didInitialize.current = true;
  }, [editing, cardQuery.data]);

  useEffect(() => {
    if (editing || didInitialize.current || !(profileQuery.isSuccess || profileQuery.isError)) return;
    const profile = profileQuery.data;
    if (profile) {
      setDocument((current) => ({
        ...current,
        identity: {
          ...current.identity,
          fullName: profile.fullName ?? '',
          jobTitle: profile.jobTitle ?? null,
          company: profile.company ?? null,
          email: profile.email ?? user?.email ?? null,
          phone: profile.phone ?? null,
          website: profile.website ?? null,
          address: profile.address ?? null,
          socialLinks: {
            ...(profile.linkedinUrl ? { linkedin: profile.linkedinUrl } : {}),
            ...(profile.githubUrl ? { github: profile.githubUrl } : {}),
            ...(profile.instagramUrl ? { instagram: profile.instagramUrl } : {}),
            ...(profile.xUrl ? { x: profile.xUrl } : {}),
          },
          avatarPath: isPrivateProfileAsset(profile.avatarUrl) && user?.id ? `${user.id}/avatar` : null,
          companyLogoPath: isPrivateProfileAsset(profile.companyLogoUrl) && user?.id ? `${user.id}/company-logo` : null,
        },
        brand: {
          primaryColor: profile.primaryBrandColor || current.brand.primaryColor,
          secondaryColor: profile.secondaryBrandColor || current.brand.secondaryColor,
        },
      }));
      setIsPrefilled(true);
    }
    didInitialize.current = true;
  }, [editing, profileQuery.isSuccess, profileQuery.isError, profileQuery.data, user?.id, user?.email]);

  const template = useMemo(() => businessCardTemplates.find((item) => item.key === document.templateKey), [document.templateKey]);

  const updateIdentity = (key: keyof BusinessCardDocument['identity'], value: string | null) => {
    setDocument((current) => ({ ...current, identity: { ...current.identity, [key]: value } }));
  };

  const updateVisibility = (key: keyof BusinessCardVisibility, checked: boolean) => {
    setDocument((current) => ({ ...current, visibility: { ...current.visibility, [key]: checked } }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    try {
      const normalized = parseBusinessCardDocument(document);
      if (editing) await updateCard.mutateAsync({ id, input: { title, document: normalized } });
      else await createCard.mutateAsync({ title, document: normalized });
      navigate('/business-cards');
    } catch (error) {
      setFormError(getBusinessCardErrorMessage(error));
    }
  };

  if (editing && (cardQuery.isLoading || !didInitialize.current && cardQuery.data)) return <div className="bc-state" role="status">Chargement de votre carte…</div>;
  if (editing && (cardQuery.isError || !cardQuery.data)) return <div className="bc-state bc-state-error" role="alert"><h1>Carte introuvable</h1><p>Cette carte n’existe pas ou vous n’y avez pas accès.</p><Link to="/business-cards" className="btn btn-outline">Retour aux cartes</Link></div>;

  return (
    <div className="tool-page business-card-editor">
      <header className="bc-editor-heading">
        <div><Link to="/business-cards" className="bc-back-link"><ArrowLeft size={16} /> Mes cartes</Link><p className="bc-overline">ÉDITEUR · {editing ? 'CARTE ENREGISTRÉE' : 'NOUVELLE CARTE'}</p><h1>{editing ? 'Ajuster la composition' : 'Composer votre carte'}<span>.</span></h1><p>Les changements restent propres à cette carte et ne modifient pas votre profil.</p></div>
        <div className="bc-editor-template-indicator"><span>{template?.mark}</span><small>{template?.name}</small></div>
      </header>

      <div className="bc-mobile-preview"><div className="bc-mobile-preview-heading"><span className="bc-overline">APERÇU</span><span><Eye size={14} /> Mis à jour en direct</span></div><BusinessCardPreview document={document} side={activeSide} onSideChange={setActiveSide} compact /></div>

      <div className="bc-editor-layout">
        <form className="bc-editor-form" onSubmit={(event) => void submit(event)} noValidate>
          {isPrefilled && !editing && <p className="bc-prefill-note"><Check size={14} /> Informations reprises de votre profil — modifiez-les librement pour cette carte.</p>}
          {formError && <div className="bc-form-error" role="alert">{formError}</div>}
          <section className="bc-form-section">
            <div className="bc-section-title"><span>01</span><div><h2>Votre carte</h2><p>Un nom pour la retrouver dans votre espace.</p></div></div>
            <Field label="Nom de la carte"><input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Carte professionnelle" /></Field>
          </section>

          <section className="bc-form-section">
            <div className="bc-section-title"><span>02</span><div><h2>Identité</h2><p>Les coordonnées de cette version.</p></div></div>
            <div className="bc-fields-grid">
              <Field label="Nom complet"><input required maxLength={150} value={document.identity.fullName} onChange={(event) => updateIdentity('fullName', event.target.value)} autoComplete="name" /></Field>
              <Field label="Fonction"><input maxLength={120} value={document.identity.jobTitle || ''} onChange={(event) => updateIdentity('jobTitle', event.target.value)} autoComplete="organization-title" /></Field>
              <Field label="Entreprise"><input maxLength={150} value={document.identity.company || ''} onChange={(event) => updateIdentity('company', event.target.value)} autoComplete="organization" /></Field>
              <Field label="Email"><input type="email" maxLength={254} value={document.identity.email || ''} onChange={(event) => updateIdentity('email', event.target.value)} autoComplete="email" /></Field>
              <Field label="Téléphone"><input type="tel" maxLength={32} value={document.identity.phone || ''} onChange={(event) => updateIdentity('phone', event.target.value)} autoComplete="tel" /></Field>
              {urlInput(document.identity.website, 'Site web', (value) => updateIdentity('website', value))}
            </div>
            <details className="bc-disclosure"><summary>Adresse, réseaux & visibilité <ChevronDown size={16} /></summary>
              <div className="bc-disclosure-content">
                <Field label="Adresse"><textarea rows={2} maxLength={300} value={document.identity.address || ''} onChange={(event) => updateIdentity('address', event.target.value)} autoComplete="street-address" /></Field>
                <div className="bc-fields-grid">{socialFields.map((social) => <div key={social.key}>{urlInput(document.identity.socialLinks[social.key], social.label, (value) => setDocument((current) => ({ ...current, identity: { ...current.identity, socialLinks: { ...current.identity.socialLinks, [social.key]: value } } })), social.placeholder)}</div>)}</div>
                <div className="bc-visibility-grid"><VisibilityToggle label="Nom" checked={document.visibility.fullName} onChange={(checked) => updateVisibility('fullName', checked)} /><VisibilityToggle label="Fonction" checked={document.visibility.jobTitle} onChange={(checked) => updateVisibility('jobTitle', checked)} /><VisibilityToggle label="Entreprise" checked={document.visibility.company} onChange={(checked) => updateVisibility('company', checked)} /><VisibilityToggle label="Email" checked={document.visibility.email} onChange={(checked) => updateVisibility('email', checked)} /><VisibilityToggle label="Téléphone" checked={document.visibility.phone} onChange={(checked) => updateVisibility('phone', checked)} /><VisibilityToggle label="Site web" checked={document.visibility.website} onChange={(checked) => updateVisibility('website', checked)} /><VisibilityToggle label="Adresse" checked={document.visibility.address} onChange={(checked) => updateVisibility('address', checked)} />{socialFields.map((social) => <VisibilityToggle key={social.key} label={social.label} checked={document.visibility[social.key]} onChange={(checked) => updateVisibility(social.key, checked)} />)}</div>
              </div>
            </details>
          </section>

          <section className="bc-form-section">
            <div className="bc-section-title"><span>03</span><div><h2>Signature visuelle</h2><p>Une photo, un logo et deux couleurs.</p></div></div>
            <div className="bc-asset-options">
              <AssetToggle label="Photo de profil" available={!!document.identity.avatarPath} checked={document.visibility.avatar} onChange={(checked) => updateVisibility('avatar', checked)} onClear={() => updateIdentity('avatarPath', null)} />
              <AssetToggle label="Logo d’entreprise" available={!!document.identity.companyLogoPath} checked={document.visibility.companyLogo} onChange={(checked) => updateVisibility('companyLogo', checked)} onClear={() => updateIdentity('companyLogoPath', null)} />
            </div>
            <div className="bc-fields-grid bc-color-fields">
              <ColorField label="Couleur principale" value={document.brand.primaryColor} onChange={(value) => setDocument((current) => ({ ...current, brand: { ...current.brand, primaryColor: value } }))} />
              <ColorField label="Couleur secondaire" value={document.brand.secondaryColor || '#E7E9E1'} onChange={(value) => setDocument((current) => ({ ...current, brand: { ...current.brand, secondaryColor: value } }))} />
            </div>
            <Field label="Composition du recto"><select value={document.sides.front.composition} onChange={(event) => setDocument((current) => ({ ...current, sides: { ...current.sides, front: { composition: event.target.value as 'identity' | 'brand' } } }))}><option value="identity">Identité en premier</option><option value="brand">Marque en premier</option></select></Field>
          </section>

          <section className="bc-form-section">
            <div className="bc-section-title"><span>04</span><div><h2>Verso & partage</h2><p>Choisissez ce qui accompagne le recto.</p></div></div>
            <VisibilityToggle label="Activer le verso" checked={document.sides.back.enabled} onChange={(checked) => setDocument((current) => ({ ...current, sides: { ...current.sides, back: { ...current.sides.back, enabled: checked } } }))} />
            {document.sides.back.enabled && <>
              <Field label="Contenu du verso"><select value={document.sides.back.composition} onChange={(event) => setDocument((current) => ({ ...current, sides: { ...current.sides, back: { ...current.sides.back, composition: event.target.value as 'contact' | 'qr' | 'contact-qr' } } }))}><option value="contact">Coordonnées</option><option value="contact-qr">Coordonnées + QR</option><option value="qr">QR seul</option></select></Field>
              <VisibilityToggle label="Afficher le QR statique" checked={!!document.qr} onChange={(checked) => {
                setDocument((current) => ({ ...current, visibility: { ...current.visibility, qr: checked }, sides: { ...current.sides, back: { ...current.sides.back, composition: checked ? 'contact-qr' : 'contact' } }, ...(checked ? { qr: { mode: 'static', type: 'url', content: current.identity.website || '' } } : { qr: undefined }) }));
              }} />
              {document.qr?.mode === 'static' && <div className="bc-qr-config">
                <Field label="Le QR contient"><select value={document.qr.type} onChange={(event) => {
                  const type = event.target.value as BusinessCardQrType;
                  setDocument((current) => current.qr?.mode !== 'static' ? current : ({ ...current, qr: { mode: 'static', type, content: type === 'url' ? current.identity.website || '' : type === 'email' ? current.identity.email || '' : type === 'phone' ? current.identity.phone || '' : type === 'vcard' ? 'contact' : '' } }));
                }}><option value="url">Une adresse web</option><option value="vcard">Une fiche contact (vCard)</option><option value="email">Un email</option><option value="phone">Un numéro de téléphone</option><option value="text">Un texte</option></select></Field>
                {document.qr.type !== 'vcard' && <Field label="Contenu encodé"><input required maxLength={2048} value={document.qr.content} onChange={(event) => setDocument((current) => current.qr?.mode !== 'static' ? current : ({ ...current, qr: { ...current.qr, content: event.target.value } }))} placeholder={document.qr.type === 'url' ? 'https://exemple.com' : document.qr.type === 'email' ? 'nom@exemple.com' : document.qr.type === 'phone' ? '+212…' : 'Votre message'} /></Field>}
                {document.qr.type === 'vcard' && <p className="bc-help-note">Le QR sera généré depuis les coordonnées renseignées ci-dessus.</p>}
              </div>}
            </>}
          </section>

          <section className="bc-form-section">
            <div className="bc-section-title"><span>05</span><div><h2>Modèle</h2><p>Cinq compositions conçues pour des usages différents.</p></div></div>
            <div className="bc-template-list" role="group" aria-label="Modèle de carte">
              {businessCardTemplates.map((item) => <button type="button" aria-pressed={document.templateKey === item.key} key={item.key} className={document.templateKey === item.key ? 'is-selected' : ''} onClick={() => setDocument((current) => ({ ...current, templateKey: item.key as BusinessCardTemplateKey }))}><span>{item.mark}</span><strong>{item.name}</strong><small>{item.note}</small>{document.templateKey === item.key && <Check size={15} />}</button>)}
            </div>
          </section>

          <div className="bc-save-row"><Link to="/business-cards" className="bc-text-button">Annuler</Link><button className="btn btn-primary" type="submit" disabled={isSaving || (!editing && !profileReady) || (editing && !didInitialize.current)}>{isSaving ? <LoaderCircle className="bc-spin" size={16} /> : <Save size={16} />}{isSaving ? 'Enregistrement…' : editing ? 'Enregistrer les changements' : 'Enregistrer la carte'}</button></div>
        </form>

        <aside className="bc-preview-sticky"><BusinessCardPreview document={document} side={activeSide} onSideChange={setActiveSide} /><div className="bc-preview-template"><span>{template?.mark} / 05</span><div><strong>{template?.name}</strong><small>{template?.note}</small></div><Eye size={15} aria-hidden="true" /></div></aside>
      </div>
    </div>
  );
}

function VisibilityToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="bc-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="bc-toggle-mark" aria-hidden="true">{checked ? <Eye size={13} /> : <EyeOff size={13} />}</span><span>{label}</span></label>;
}

function AssetToggle({ label, available, checked, onChange, onClear }: { label: string; available: boolean; checked: boolean; onChange: (checked: boolean) => void; onClear: () => void }) {
  return <div className={`bc-asset-row${available ? '' : ' is-unavailable'}`}><VisibilityToggle label={label} checked={available && checked} onChange={onChange} /><span>{available ? 'Profil WRX' : 'À ajouter dans Paramètres → Profil'}</span>{available && <button type="button" className="bc-text-button" onClick={onClear}>Retirer</button>}</div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}><div className="bc-color-input"><input aria-label={`${label} — choisir une couleur`} type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} /><code>{value.toUpperCase()}</code></div></Field>;
}

function isPrivateProfileAsset(url?: string): boolean {
  if (!url) return false;
  try {
    return /\/storage\/v1\/object\/(?:sign|public)\/avatars\//.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function getBusinessCardErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Enregistrement impossible. Vérifiez les informations et réessayez.';
  if (error.name === 'BusinessCardDocumentValidationError') return error.message;
  const jsonStart = error.message.indexOf(': {');
  if (jsonStart >= 0) {
    try {
      const payload = JSON.parse(error.message.slice(jsonStart + 2)) as { message?: string | string[] };
      if (typeof payload.message === 'string') return payload.message;
      if (Array.isArray(payload.message) && payload.message.every((message) => typeof message === 'string')) return payload.message.join(' ');
    } catch {
      // Use the calm fallback below for non-JSON API errors.
    }
  }
  return 'Enregistrement impossible. Vérifiez le nom, les coordonnées, les liens et le QR, puis réessayez.';
}
