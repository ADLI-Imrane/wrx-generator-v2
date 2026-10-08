import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Download, Eye, EyeOff, LoaderCircle, Printer, RefreshCw, Save } from 'lucide-react';
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
import { useDigitalCards } from '../hooks/useDigitalCards';
import { BusinessCardPreview } from '../components/BusinessCardPreview';
import { BusinessCardPrintDocument } from '../components/BusinessCardPrintDocument';
import { BUSINESS_CARD_MANAGED_QR_NOTICE, businessCardTemplates } from '../components/businessCardPreview.data';
import { downloadBusinessCardPng, prepareBusinessCardArtwork, BUSINESS_CARD_PRINT_SPEC } from '../components/businessCardExport';
import { publicDigitalCardUrl } from '../lib/digital-card-vcard';

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
  const digitalCardsQuery = useDigitalCards({ staleTime: 0, refetchOnWindowFocus: true });
  const createCard = useCreateBusinessCard();
  const updateCard = useUpdateBusinessCard();
  const [title, setTitle] = useState('Carte professionnelle');
  const [document, setDocument] = useState<BusinessCardDocument>(blankDocument);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [qrDestinationMode, setQrDestinationMode] = useState<'manual' | 'digital-card'>('manual');
  const [formError, setFormError] = useState('');
  const [isPrefilled, setIsPrefilled] = useState(false);
  const didInitialize = useRef(false);
  const frontArtworkRef = useRef<HTMLDivElement>(null);
  const backArtworkRef = useRef<HTMLDivElement>(null);
  const [exportTask, setExportTask] = useState<'front' | 'back' | 'print' | null>(null);
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const isSaving = createCard.isPending || updateCard.isPending;
  const profileReady = profileQuery.isSuccess || profileQuery.isError;
  const qrSource = document.qr?.mode === 'static' ? document.qr.digitalCardSource : undefined;
  const selectedDigitalCardRecord = qrSource
    ? digitalCardsQuery.data?.find((card) => card.id === qrSource.id)
    : undefined;
  const selectedDigitalCard = selectedDigitalCardRecord?.slug === qrSource?.slug && selectedDigitalCardRecord?.status === 'published'
    ? selectedDigitalCardRecord
    : undefined;
  const publishedDigitalCards = digitalCardsQuery.data?.filter((card) => card.status === 'published') ?? [];
  const qrSourceNeedsResolution = qrDestinationMode === 'digital-card' && (
    !qrSource || digitalCardsQuery.isFetching || digitalCardsQuery.isError || !selectedDigitalCard
  );
  const artworkDocument = useMemo(() => {
    if (qrDestinationMode !== 'digital-card' || !qrSourceNeedsResolution) return document;
    return { ...document, visibility: { ...document.visibility, qr: false } };
  }, [document, qrDestinationMode, qrSourceNeedsResolution]);

  useEffect(() => {
    didInitialize.current = false;
    setDocument(blankDocument());
    setTitle('Carte professionnelle');
    setActiveSide('front');
    setQrDestinationMode('manual');
    setIsPrefilled(false);
    setFormError('');
    setExportFeedback(null);
  }, [id]);

  useEffect(() => {
    if (!editing || !cardQuery.data || didInitialize.current) return;
    const saved = cardQuery.data;
    setTitle(saved.title);
    const savedDocument = parseBusinessCardDocument(saved.document);
    setDocument(savedDocument);
    setQrDestinationMode(savedDocument.qr?.mode === 'static' && savedDocument.qr.digitalCardSource ? 'digital-card' : 'manual');
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

  const setQrDestination = (mode: 'manual' | 'digital-card') => {
    setQrDestinationMode(mode);
    setFormError('');
    if (mode === 'manual') {
      setDocument((current) => {
        if (current.qr?.mode !== 'static' || !current.qr.digitalCardSource) return current;
        return {
          ...current,
          qr: {
            mode: 'static',
            type: 'url',
            content: current.identity.website || '',
          },
        };
      });
    }
  };

  const selectDigitalCard = (cardId: string) => {
    const card = digitalCardsQuery.data?.find((item) => item.id === cardId && item.status === 'published');
    if (!card) return;
    setQrDestinationMode('digital-card');
    setFormError('');
    setDocument((current) => ({
      ...current,
      visibility: { ...current.visibility, qr: true },
      sides: {
        ...current.sides,
        back: {
          ...current.sides.back,
          composition: current.sides.back.composition === 'qr' ? 'qr' : 'contact-qr',
        },
      },
      qr: {
        mode: 'static',
        type: 'url',
        content: publicDigitalCardUrl(card.slug),
        digitalCardSource: { id: card.id, slug: card.slug },
      },
    }));
  };

  const exportPng = async (side: 'front' | 'back') => {
    if (side === 'back' && qrSourceNeedsResolution) return;
    const node = (side === 'front' ? frontArtworkRef : backArtworkRef).current;
    if (!node || exportTask) return;
    setExportTask(side);
    setExportFeedback(null);
    try {
      await downloadBusinessCardPng(node, title, side);
      setExportFeedback({ type: 'success', text: `PNG ${side === 'front' ? 'recto' : 'verso'} prêt · ${BUSINESS_CARD_PRINT_SPEC.pngWidth} × ${BUSINESS_CARD_PRINT_SPEC.pngHeight} px.` });
    } catch (error) {
      setExportFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Export impossible. Réessayez.' });
    } finally {
      setExportTask(null);
    }
  };

  const printCard = async () => {
    if (qrSourceNeedsResolution) return;
    if (!frontArtworkRef.current || exportTask) return;
    setExportTask('print');
    setExportFeedback(null);
    try {
      await prepareBusinessCardArtwork(frontArtworkRef.current);
      if (document.sides.back.enabled && backArtworkRef.current) await prepareBusinessCardArtwork(backArtworkRef.current);
      window.print();
      setExportFeedback({ type: 'success', text: 'Choisissez « Enregistrer au format PDF » dans la fenêtre d’impression.' });
    } catch (error) {
      setExportFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Préparation de l’impression impossible. Réessayez.' });
    } finally {
      setExportTask(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (qrSourceNeedsResolution) {
      setFormError('Vérifiez, remplacez ou retirez la Carte numérique sélectionnée avant d’enregistrer ou d’exporter le verso.');
      return;
    }
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
  if (!editing && !profileReady) return <div className="bc-state" role="status">Chargement de votre identité…</div>;

  return (
    <div className="tool-page business-card-editor">
      <header className="bc-editor-heading">
        <div><Link to="/business-cards" className="bc-back-link"><ArrowLeft size={16} /> Mes cartes</Link><p className="bc-overline">ÉDITEUR · {editing ? 'CARTE ENREGISTRÉE' : 'NOUVELLE CARTE'}</p><h1>{editing ? 'Ajuster la composition' : 'Composer votre carte'}<span>.</span></h1><p>Les changements restent propres à cette carte et ne modifient pas votre profil.</p></div>
        <div className="bc-editor-template-indicator"><span>{template?.mark}</span><small>{template?.name}</small></div>
      </header>

      <div className="bc-mobile-preview"><div className="bc-mobile-preview-heading"><span className="bc-overline">APERÇU</span><span><Eye size={14} /> Mis à jour en direct</span></div><BusinessCardPreview document={artworkDocument} side={activeSide} onSideChange={setActiveSide} compact /></div>

      <div className="bc-editor-layout">
        <form className="bc-editor-form" onSubmit={(event) => void submit(event)} noValidate>
          {isPrefilled && !editing && <p className="bc-prefill-note"><Check size={14} /> Informations reprises de votre profil — modifiez-les librement pour cette carte.</p>}
          {profileQuery.isError && !editing && <p className="bc-help-note" role="status">Votre profil n’a pas pu être chargé. Vous pouvez renseigner les coordonnées de cette carte directement.</p>}
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
            <VisibilityToggle label="Activer le verso" checked={document.sides.back.enabled} onChange={(checked) => {
              if (!checked) setActiveSide('front');
              if (!checked) setQrDestinationMode('manual');
              setDocument((current) => ({ ...current, ...(!checked ? { qr: undefined } : {}), sides: { ...current.sides, back: { ...current.sides.back, enabled: checked } } }));
            }} />
            {document.sides.back.enabled && <>
              <Field label="Contenu du verso"><select value={document.sides.back.composition} onChange={(event) => {
                const composition = event.target.value as 'contact' | 'qr' | 'contact-qr';
                if (composition === 'contact') setQrDestinationMode('manual');
                setDocument((current) => ({ ...current, ...(composition === 'contact' ? { qr: undefined } : {}), sides: { ...current.sides, back: { ...current.sides.back, composition } } }));
              }}><option value="contact">Coordonnées</option><option value="contact-qr">Coordonnées + QR</option><option value="qr">QR seul</option></select></Field>
              {document.qr?.mode === 'managed' && <div className="bc-form-error" role="alert"><p>{BUSINESS_CARD_MANAGED_QR_NOTICE}</p><button type="button" className="bc-text-button" onClick={() => setDocument((current) => ({ ...current, qr: undefined, sides: { ...current.sides, back: { ...current.sides.back, composition: 'contact' } } }))}>Retirer le QR non pris en charge</button></div>}
              <p className="bc-help-note">QR statique : contenu fixe, sans suivi des scans.</p>
              <VisibilityToggle label="Afficher le QR statique" checked={document.qr?.mode === 'static'} onChange={(checked) => {
                setQrDestinationMode('manual');
                setDocument((current) => ({ ...current, visibility: { ...current.visibility, qr: checked }, sides: { ...current.sides, back: { ...current.sides.back, composition: checked ? 'contact-qr' : 'contact' } }, ...(checked ? { qr: { mode: 'static', type: 'url', content: current.identity.website || '' } } : { qr: undefined }) }));
              }} />
              {document.qr?.mode === 'static' && <div className="bc-qr-config">
                <Field label="Destination du QR"><select value={qrDestinationMode} onChange={(event) => setQrDestination(event.target.value as 'manual' | 'digital-card')}><option value="manual">Destination manuelle / statique</option><option value="digital-card">Carte numérique publiée</option></select></Field>
                {qrDestinationMode === 'digital-card' ? <div className="bc-qr-digital-source">
                  {digitalCardsQuery.isFetching && <p className="bc-help-note" role="status">Vérification des Cartes numériques publiées…</p>}
                  {digitalCardsQuery.isError && <div className="bc-qr-source-warning" role="alert"><p>Impossible de vérifier la publication de cette destination. Réessayez ou revenez à une destination manuelle.</p><button type="button" className="bc-text-button" onClick={() => void digitalCardsQuery.refetch()}><RefreshCw size={13} /> Réessayer</button></div>}
                  {!digitalCardsQuery.isFetching && !digitalCardsQuery.isError && qrSource && !selectedDigitalCard && <div className="bc-qr-source-warning" role="alert"><p>{selectedDigitalCardRecord ? `« ${selectedDigitalCardRecord.title} » n’est plus publiée.` : 'La Carte numérique sélectionnée n’est plus disponible.'} Son adresse publique ne peut donc pas être considérée comme fonctionnelle.</p><button type="button" className="bc-text-button" onClick={() => setQrDestination('manual')}>Retirer la sélection</button></div>}
                  {!digitalCardsQuery.isFetching && !digitalCardsQuery.isError && publishedDigitalCards.length > 0 && <Field label={qrSource && !selectedDigitalCard ? 'Choisir une carte publiée pour remplacer' : 'Carte numérique publiée'}><select value={selectedDigitalCard?.id ?? ''} onChange={(event) => selectDigitalCard(event.target.value)}><option value="">Choisir une carte…</option>{publishedDigitalCards.map((card) => <option key={card.id} value={card.id}>{card.title} · {card.document.identity.fullName}</option>)}</select></Field>}
                  {!digitalCardsQuery.isFetching && !digitalCardsQuery.isError && publishedDigitalCards.length === 0 && !qrSource && <p className="bc-help-note">Aucune Carte numérique publiée. <Link to="/digital-cards">Publier une carte</Link> avant de la sélectionner ici.</p>}
                  {!qrSourceNeedsResolution && selectedDigitalCard && document.qr?.mode === 'static' && <div className="bc-qr-source-summary"><strong>{selectedDigitalCard.title}</strong><code>{document.qr.content}</code><p>L’adresse encodée reste fixe après impression. La Carte numérique doit rester publiée pour être accessible.</p></div>}
                  <p className="bc-help-note">Le QR reste statique : aucun suivi des scans. Une carte dépubliée ne sera plus accessible à cette adresse.</p>
                </div> : <>
                <Field label="Le QR contient"><select value={document.qr.type} onChange={(event) => {
                  const type = event.target.value as BusinessCardQrType;
                  setDocument((current) => current.qr?.mode !== 'static' ? current : ({ ...current, qr: { mode: 'static', type, content: type === 'url' ? current.identity.website || '' : type === 'email' ? current.identity.email || '' : type === 'phone' ? current.identity.phone || '' : type === 'vcard' ? 'contact' : '' } }));
                }}><option value="url">Une adresse web</option><option value="vcard">Une fiche contact (vCard)</option><option value="email">Un email</option><option value="phone">Un numéro de téléphone</option><option value="text">Un texte</option></select></Field>
                {document.qr.type !== 'vcard' && <Field label="Contenu encodé"><input required maxLength={2048} value={document.qr.content} onChange={(event) => setDocument((current) => current.qr?.mode !== 'static' ? current : ({ ...current, qr: { ...current.qr, content: event.target.value } }))} placeholder={document.qr.type === 'url' ? 'https://exemple.com' : document.qr.type === 'email' ? 'nom@exemple.com' : document.qr.type === 'phone' ? '+212…' : 'Votre message'} /></Field>}
                {document.qr.type === 'vcard' && <p className="bc-help-note">Le QR sera généré depuis les coordonnées renseignées ci-dessus.</p>}
                </>}
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
          <section className="bc-export-section" aria-labelledby="bc-export-title">
            <div><span className="bc-overline">DERNIÈRE ÉTAPE</span><h2 id="bc-export-title">Prête à circuler.</h2><p>PNG haute résolution ou impression recto{document.sides.back.enabled ? ' + verso' : ''} au format carte.</p></div>
            <div className="bc-export-actions">
              <button type="button" className="btn btn-outline" disabled={!!exportTask} onClick={() => void exportPng('front')}>{exportTask === 'front' ? <LoaderCircle className="bc-spin" size={15} /> : <Download size={15} />}PNG recto</button>
              <button type="button" className="btn btn-outline" disabled={!!exportTask || !document.sides.back.enabled || qrSourceNeedsResolution} title={!document.sides.back.enabled ? 'Activez le verso pour l’exporter' : qrSourceNeedsResolution ? 'Vérifiez ou remplacez la Carte numérique sélectionnée' : 'Télécharger le verso en PNG'} onClick={() => void exportPng('back')}>{exportTask === 'back' ? <LoaderCircle className="bc-spin" size={15} /> : <Download size={15} />}PNG verso</button>
              <button type="button" className="btn btn-primary" disabled={!!exportTask || qrSourceNeedsResolution} onClick={() => void printCard()}>{exportTask === 'print' ? <LoaderCircle className="bc-spin" size={15} /> : <Printer size={15} />}Imprimer / Enregistrer PDF</button>
            </div>
            <p className={`bc-export-feedback${exportFeedback?.type === 'error' ? ' is-error' : ''}`} role={exportFeedback?.type === 'error' ? 'alert' : 'status'} aria-live="polite">{exportTask ? exportTask === 'print' ? 'Préparation des faces et des images…' : `Création du PNG ${exportTask === 'front' ? 'recto' : 'verso'}…` : exportFeedback?.text || `PNG ${BUSINESS_CARD_PRINT_SPEC.pngWidth} × ${BUSINESS_CARD_PRINT_SPEC.pngHeight} px · impression ${BUSINESS_CARD_PRINT_SPEC.widthMm} × ${BUSINESS_CARD_PRINT_SPEC.heightMm} mm.`}</p>
          </section>
        </form>

        <aside className="bc-preview-sticky"><BusinessCardPreview document={artworkDocument} side={activeSide} onSideChange={setActiveSide} /><div className="bc-preview-template"><span>{template?.mark} / 05</span><div><strong>{template?.name}</strong><small>{template?.note}</small></div><Eye size={15} aria-hidden="true" /></div></aside>
      </div>
      <BusinessCardPrintDocument card={artworkDocument} frontRef={frontArtworkRef} backRef={backArtworkRef} />
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
