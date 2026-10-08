import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Code2, Copy, Eye, EyeOff, ImagePlus, Save, Trash2 } from 'lucide-react';
import { EMAIL_SIGNATURE_TEMPLATE_IDS, parseEmailSignatureDocument, type EmailSignatureDocumentV1, type EmailSignatureImageKind } from '@wrx/shared';
import { Modal } from '../components/Modal';
import { EmailSignatureArtwork } from '../components/EmailSignatureArtwork';
import { useAuthStore } from '../stores/auth.store';
import { useProfile } from '../hooks/useAuth';
import {
  useCreateEmailSignature, useDeleteEmailSignatureAsset, useEmailSignature, useEmailSignatureAssets,
  usePublishProfileSignatureImage, useUpdateEmailSignature, useUploadEmailSignatureImage,
} from '../hooks/useEmailSignatures';
import { blankEmailSignatureDocument, emailSignatureFromProfile } from '../lib/email-signature-mapping';
import { buildEmailSignaturePresentation } from '../lib/email-signature-presentation';
import { copyEmailSignature, copyEmailSignatureHtml } from '../lib/email-signature-clipboard';
import { renderEmailSignatureHtml, renderEmailSignaturePlainText } from '../lib/email-signature-renderer';
import '../styles/email-signatures.css';

const templateNames = { signal: 'Signal', compact: 'Compact', inline: 'Inline' } as const;
const profileImageAvailable = (url?: string) => Boolean(url);
type PendingImagePublication = { kind: EmailSignatureImageKind; source: 'profile' } | { kind: EmailSignatureImageKind; source: 'upload'; file: File };

export function EmailSignatureEditorPage() {
  const { id = '' } = useParams<{ id: string }>();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const profile = useProfile();
  const record = useEmailSignature(id);
  const assets = useEmailSignatureAssets();
  const create = useCreateEmailSignature();
  const update = useUpdateEmailSignature();
  const publishProfileImage = usePublishProfileSignatureImage();
  const uploadImage = useUploadEmailSignatureImage();
  const deleteAsset = useDeleteEmailSignatureAsset();
  const [title, setTitle] = useState('Signature principale');
  const [document, setDocument] = useState<EmailSignatureDocumentV1>(blankEmailSignatureDocument);
  const [sourceChosen, setSourceChosen] = useState(false);
  const [hydratedId, setHydratedId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingImagePublication, setPendingImagePublication] = useState<PendingImagePublication | null>(null);
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    setTitle('Signature principale'); setDocument(blankEmailSignatureDocument()); setError(''); setNotice(''); setCopyFeedback(null);
    setSourceChosen(false); setHydratedId('');
    if (!editing) setSourceChosen(false);
  }, [id, editing]);
  useEffect(() => {
    if (!editing || record.data?.id !== id) return;
    setTitle(record.data.title); setDocument(parseEmailSignatureDocument(record.data.document));
    setSourceChosen(true); setHydratedId(id); setError('');
  }, [editing, id, record.data]);

  const previewAssets = assets.data ?? [];
  const copySignature = async () => {
    setCopyFeedback(null);
    try {
      const validated = parseEmailSignatureDocument(document);
      const model = buildEmailSignaturePresentation(validated, previewAssets, { strict: true });
      const mode = await copyEmailSignature(renderEmailSignatureHtml(model), renderEmailSignaturePlainText(model));
      setCopyFeedback({ type: 'success', message: mode === 'rich' ? 'Signature copiée avec mise en forme.' : 'Texte copié. Le formatage riche n’est pas disponible dans ce navigateur.' });
    } catch {
      setCopyFeedback({ type: 'error', message: 'Copie impossible. Vérifiez les champs et les permissions du presse-papiers.' });
    }
  };
  const copyHtmlSource = async () => {
    setCopyFeedback(null);
    try {
      const validated = parseEmailSignatureDocument(document);
      const model = buildEmailSignaturePresentation(validated, previewAssets, { strict: true });
      await copyEmailSignatureHtml(renderEmailSignatureHtml(model));
      setCopyFeedback({ type: 'success', message: 'Code HTML autonome copié.' });
    } catch {
      setCopyFeedback({ type: 'error', message: 'Copie HTML impossible. Vérifiez les champs et les permissions du presse-papiers.' });
    }
  };
  const busy = saving || publishProfileImage.isPending || uploadImage.isPending || deleteAsset.isPending;
  const setIdentity = (key: keyof EmailSignatureDocumentV1['identity'], value: string | null) => setDocument((old) => ({ ...old, identity: { ...old.identity, [key]: value } }));
  const setContact = (key: keyof EmailSignatureDocumentV1['contact'], value: string | null) => setDocument((old) => ({ ...old, contact: { ...old.contact, [key]: value } }));
  const setVisibility = (key: keyof EmailSignatureDocumentV1['visibility'], value: boolean) => setDocument((old) => ({ ...old, visibility: { ...old.visibility, [key]: value } }));
  const startProfile = () => {
    if (!profile.data) return;
    setDocument(emailSignatureFromProfile(profile.data, user?.email));
    setTitle(profile.data.company ? `${profile.data.company} · signature` : 'Signature principale');
    setSourceChosen(true); setNotice('Informations du profil copiées. Les modifications restent indépendantes.');
  };
  const startBlank = () => { setDocument(blankEmailSignatureDocument()); setTitle('Signature principale'); setSourceChosen(true); setNotice(''); };
  const changeImage = (kind: EmailSignatureImageKind, assetId: string | null, altText = '') => setDocument((old) => ({
    ...old,
    images: { ...old.images, [kind === 'avatar' ? 'avatar' : 'companyLogo']: assetId ? { assetId, altText } : null },
    visibility: { ...old.visibility, [kind === 'avatar' ? 'avatar' : 'companyLogo']: Boolean(assetId) },
  }));

  const save = async () => {
    const parsed = parseEmailSignatureDocument(document);
    const normalizedTitle = title.trim();
    if (!normalizedTitle) throw new Error('Ajoutez un titre interne à cette signature.');
    if (editing) return update.mutateAsync({ id, input: { title: normalizedTitle, document: parsed } });
    return create.mutateAsync({ title: normalizedTitle, document: parsed });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const saved = await save();
      if (!editing) navigate(`/email-signatures/${saved.id}/edit`, { replace: true });
      else setNotice('Modifications enregistrées.');
    } catch (cause) { setError(readableError(cause)); }
  };
  const confirmImagePublication = async () => {
    if (!pendingImagePublication) return;
    try {
      const asset = pendingImagePublication.source === 'profile'
        ? await publishProfileImage.mutateAsync(pendingImagePublication.kind)
        : await uploadImage.mutateAsync({ file: pendingImagePublication.file, kind: pendingImagePublication.kind });
      const label = pendingImagePublication.kind === 'avatar' ? 'Photo de profil' : 'Logo de l’entreprise';
      changeImage(pendingImagePublication.kind, asset.id, pendingImagePublication.source === 'upload' ? pendingImagePublication.file.name.replace(/\.[^.]+$/, '') || label : label);
      setPendingImagePublication(null); setNotice('Copie publiée et ajoutée à cette signature. Enregistrez pour conserver la référence.');
    } catch (cause) { setError(readableError(cause)); setPendingImagePublication(null); }
  };
  const onUpload = (event: React.ChangeEvent<HTMLInputElement>, kind: EmailSignatureImageKind) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setError('');
    setPendingImagePublication({ kind, source: 'upload', file });
  };
  const removeAsset = async (assetId: string) => {
    setError('');
    try { await deleteAsset.mutateAsync(assetId); }
    catch (cause) { setError(readableError(cause, 'Cette image est encore utilisée par une signature enregistrée. Retirez-la et enregistrez avant de la supprimer.')); }
  };

  if (editing && (record.isError || (record.data && record.data.id !== id))) return <div className="es-state" role="alert"><h1>Signature introuvable</h1><p>Cette signature n’existe pas ou vous n’y avez pas accès.</p><Link className="btn btn-outline" to="/email-signatures">Retour aux signatures</Link></div>;
  if (editing && (record.isLoading || hydratedId !== id)) return <div className="es-state" role="status">Chargement de votre signature…</div>;

  return <div className="tool-page email-signature-editor">
    <header className="es-page-heading es-editor-heading"><div><Link to="/email-signatures" className="es-back"><ArrowLeft size={15}/> Mes signatures</Link><span className="es-kicker">CORRESPONDANCE · {editing ? 'ÉDITION' : 'NOUVELLE SIGNATURE'}</span><h1>{editing ? 'Ajuster la signature' : 'Composer une signature'}<span>.</span></h1><p>Un instantané indépendant. Rien ici ne modifie votre profil.</p></div></header>
    {(error || notice) && <p className={error ? 'es-error' : 'es-notice'} role={error ? 'alert' : 'status'}>{error || notice}</p>}

    {!editing && !sourceChosen ? <section className="es-source-panel"><div><span className="es-kicker">POINT DE DÉPART</span><h2>Reprendre votre identité ou commencer simplement.</h2><p>Le profil est copié une seule fois. Les images privées ne sont jamais publiées par cette action.</p></div><div className="es-source-actions"><button className="btn btn-primary" type="button" disabled={profile.isLoading || !profile.data} onClick={startProfile}>{profile.isLoading ? 'Chargement du profil…' : 'Démarrer depuis le profil'}</button><button className="btn btn-outline" type="button" onClick={startBlank}>Commencer à blanc</button></div></section> : <form className="es-editor-form" onSubmit={(event) => void submit(event)}>
      <div className="es-editor-grid">
        <div className="es-form-column">
          <section className="es-form-section"><SectionTitle number="01" title="Identité"/><Field label="Titre interne"><input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} required /></Field>
            <div className="es-fields-grid"><Field label="Nom complet"><input value={document.identity.fullName} maxLength={150} onChange={(e) => setIdentity('fullName', e.target.value)} /></Field><Visibility label="Afficher le nom" checked={document.visibility.fullName} onChange={(v) => setVisibility('fullName', v)}/>
              <Field label="Fonction"><input value={document.identity.jobTitle ?? ''} maxLength={120} onChange={(e) => setIdentity('jobTitle', e.target.value || null)} /></Field><Visibility label="Afficher la fonction" checked={document.visibility.jobTitle} onChange={(v) => setVisibility('jobTitle', v)}/>
              <Field label="Entreprise"><input value={document.identity.company ?? ''} maxLength={150} onChange={(e) => setIdentity('company', e.target.value || null)} /></Field><Visibility label="Afficher l’entreprise" checked={document.visibility.company} onChange={(v) => setVisibility('company', v)}/></div>
          </section>
          <section className="es-form-section"><SectionTitle number="02" title="Contact"/><div className="es-field-list">{(['email','phone','website','address'] as const).map((key) => { const label = {email:'Email',phone:'Téléphone',website:'Site web',address:'Adresse'}[key]; return <div className="es-field-visibility" key={key}><Field label={label}><input type={key === 'email' ? 'email' : 'text'} value={document.contact[key] ?? ''} maxLength={key === 'address' ? 300 : 500} onChange={(e) => setContact(key, e.target.value || null)} /></Field><Visibility label={`${label} visible`} checked={document.visibility[key]} onChange={(v) => setVisibility(key, v)}/></div>; })}</div></section>
          <section className="es-form-section"><SectionTitle number="03" title="Réseaux"/><div className="es-field-list">{(['linkedin','github','instagram','x'] as const).map((key) => { const label = {linkedin:'LinkedIn',github:'GitHub',instagram:'Instagram',x:'X'}[key]; return <div className="es-field-visibility" key={key}><Field label={label}><input type="url" placeholder={`https://${key === 'x' ? 'x.com' : `${key}.com`}/…`} value={document.socialLinks[key] ?? ''} onChange={(e) => setDocument((old) => ({ ...old, socialLinks: { ...old.socialLinks, [key]: e.target.value || undefined } }))} /></Field><Visibility label={`${label} visible`} checked={document.visibility[key]} onChange={(v) => setVisibility(key, v)}/></div>; })}</div></section>
          <section className="es-form-section"><SectionTitle number="04" title="Images"/><p className="es-helper">Une image choisie pour la signature reçoit une copie durable et publique. Le fichier original de votre profil reste privé.</p>
            {(['avatar','company-logo'] as const).map((kind) => { const key = kind === 'avatar' ? 'avatar' : 'companyLogo'; const selectedId = document.images[key]?.assetId; const profileUrl = kind === 'avatar' ? profile.data?.avatarUrl : profile.data?.companyLogoUrl; const matchingAssets = previewAssets.filter((asset) => asset.kind === kind); return <div className="es-image-control" key={kind}>
              <div className="es-image-heading"><strong>{kind === 'avatar' ? 'Photo' : 'Logo d’entreprise'}</strong><Visibility label={`${kind === 'avatar' ? 'Photo' : 'Logo'} visible`} checked={document.visibility[key]} onChange={(v) => setVisibility(key, v)}/></div>
              {selectedId ? <div className="es-selected-image"><img src={previewAssets.find((asset) => asset.id === selectedId)?.publicUrl} alt=""/><span>Image publiée · {previewAssets.find((asset) => asset.id === selectedId)?.byteSize ? `${Math.ceil(previewAssets.find((asset) => asset.id === selectedId)!.byteSize / 1024)} Ko` : 'chargement'}</span><button type="button" className="es-link-button" onClick={() => changeImage(kind, null)}>Retirer de cette signature</button></div> : <p className="es-helper">Aucune image sélectionnée.</p>}
              <div className="es-image-actions">{profileImageAvailable(profileUrl) && <button className="es-link-button" type="button" disabled={busy} onClick={() => setPendingImagePublication({ kind, source: 'profile' })}>Publier une copie du profil</button>}<label className="es-file-button"><ImagePlus size={15}/> Importer PNG/JPEG<input type="file" accept="image/png,image/jpeg" onChange={(event) => onUpload(event, kind)} /></label></div>
              {matchingAssets.length > 0 && <div className="es-asset-choices"><span className="es-kicker">IMAGES DÉJÀ PUBLIÉES</span>{matchingAssets.map((asset) => <div key={asset.id}><button type="button" className="es-link-button" onClick={() => changeImage(kind, asset.id, kind === 'avatar' ? 'Photo' : 'Logo')}>{asset.id === selectedId ? <Check size={14}/> : null} Utiliser {asset.contentType === 'image/png' ? 'PNG' : 'JPEG'} · {Math.ceil(asset.byteSize / 1024)} Ko</button><button type="button" className="es-link-button es-delete-asset" aria-label={`Supprimer ${kind === 'avatar' ? 'la photo' : 'le logo'} ${asset.contentType === 'image/png' ? 'PNG' : 'JPEG'}`} onClick={() => void removeAsset(asset.id)}><Trash2 size={14}/> Supprimer</button></div>)}</div>}
            </div>; })}
          </section>
          <section className="es-form-section"><SectionTitle number="05" title="Composition"/><div className="es-template-options">{EMAIL_SIGNATURE_TEMPLATE_IDS.map((template) => <button type="button" key={template} aria-pressed={document.templateId === template} className={`es-template-option ${document.templateId === template ? 'is-selected' : ''}`} onClick={() => setDocument((old) => ({ ...old, templateId: template }))}><span className={`es-template-glyph glyph-${template}`} aria-hidden="true"/><strong>{templateNames[template]}</strong><small>{template === 'signal' ? 'Repère vertical et hiérarchie nette' : template === 'compact' ? 'Signature dense, sans perte de lecture' : 'Identité et contact sur une ligne'}</small></button>)}</div><Field label="Couleur d’accent"><div className="es-color-field"><input aria-label="Couleur d’accent" type="color" value={document.brand.accentColor ?? '#235EE7'} onChange={(e) => setDocument((old) => ({ ...old, brand: { accentColor: e.target.value.toUpperCase() } }))}/><code>{document.brand.accentColor ?? '#235EE7'}</code></div></Field></section>
        </div>
        <aside className="es-preview-column"><div className="es-preview-sticky"><div className="es-preview-label"><span className="es-kicker">APERÇU DE SIGNATURE</span><span><Eye size={14}/> Champs visibles</span></div><EmailSignatureArtwork document={document} assets={previewAssets}/><p className="es-preview-caption">Le rendu copié reprend cette composition avec des tableaux et styles intégrés pour les messageries.</p></div></aside>
      </div>
      <section className="es-export-panel" aria-labelledby="es-export-title">
        <div className="es-export-heading"><div><span className="es-kicker">UTILISER VOTRE SIGNATURE</span><h2 id="es-export-title">Copier puis installer</h2><p>Les champs masqués ne seront pas copiés.</p></div><div className="es-export-actions"><button className="btn btn-primary" type="button" onClick={() => void copySignature()}><Copy size={16}/> Copier la signature</button><button className="btn btn-outline" type="button" onClick={() => void copyHtmlSource()}><Code2 size={16}/> Copier le code HTML</button></div></div>
        {copyFeedback && <p className={copyFeedback.type === 'error' ? 'es-error' : 'es-notice'} role={copyFeedback.type === 'error' ? 'alert' : 'status'}>{copyFeedback.message}</p>}
        <details className="es-install-guide"><summary>Instructions d’installation</summary><div className="es-client-guides">
          <section><h3>Gmail</h3><p>Ouvrez Paramètres → Voir tous les paramètres → Général → Signature. Créez ou sélectionnez une signature, collez dans l’éditeur, puis enregistrez les modifications.</p></section>
          <section><h3>Outlook</h3><p>Ouvrez Paramètres → Comptes → Signatures (ou Courrier → Rédiger et répondre selon la version). Créez une signature, collez dans l’éditeur, puis enregistrez.</p></section>
          <section><h3>Apple Mail</h3><p>Ouvrez Mail → Réglages → Signatures. Choisissez le compte, ajoutez une signature et collez dans son aperçu.</p></section>
        </div><p className="es-install-note">Les espacements et polices peuvent varier selon le client. Les images hébergées peuvent nécessiter l’autorisation de chargement du destinataire. Supprimer une image WRX publiée peut aussi la retirer des anciens emails qui la référencent.</p></details>
      </section>
      <div className="es-save-bar"><span>{editing ? 'Modifications enregistrées uniquement dans cette signature.' : 'Enregistrez pour conserver votre signature.'}</span><button className="btn btn-primary" type="submit" disabled={busy}>{saving ? 'Enregistrement…' : <><Save size={16}/> Enregistrer</>}</button></div>
    </form>}
    <Modal isOpen={!!pendingImagePublication} onClose={() => !busy && setPendingImagePublication(null)} title="Publier une image de signature ?">
      <div className="es-disclosure">{pendingImagePublication?.source === 'profile' ? <p>WRX copiera le fichier sélectionné depuis votre stockage privé vers l’espace dédié aux images de signature. Votre image originale de profil reste privée et inchangée.</p> : <p>Le fichier sélectionné sera publié dans l’espace dédié aux images de signature.</p>}<p><strong>La copie devient publiquement accessible</strong> via son image URL afin que les destinataires puissent la charger dans leurs emails.</p><p>Les anciens emails peuvent perdre cette image si la copie publiée est supprimée plus tard.</p></div>
      {error && <p className="es-error" role="alert">{error}</p>}<div className="es-modal-actions"><button type="button" className="btn btn-outline" disabled={busy} onClick={() => setPendingImagePublication(null)}>Annuler</button><button type="button" className="btn btn-primary" disabled={busy} onClick={() => void confirmImagePublication()}>{busy ? 'Publication…' : 'Publier la copie'}</button></div>
    </Modal>
  </div>;
}

function SectionTitle({ number, title }: { number: string; title: string }) { return <div className="es-section-title"><span>{number} /</span><h2>{title}</h2></div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="es-field"><span>{label}</span>{children}</label>; }
function Visibility({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="es-visibility"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><span>{checked ? <Eye size={13}/> : <EyeOff size={13}/>}</span>{label}</label>; }
function readableError(error: unknown, fallback = 'Cette action n’a pas abouti. Vérifiez vos données et réessayez.') {
  if (!(error instanceof Error)) return fallback;
  const conflictMessage = 'This image is used by a saved Email Signature; replace it before deleting';
  if (error.message.includes(conflictMessage)) return 'Cette image est référencée par une signature enregistrée. Retirez-la de chaque signature et enregistrez avant de supprimer l’image.';
  const start = error.message.indexOf(': {');
  if (start >= 0) try { const body = JSON.parse(error.message.slice(start + 2)) as { message?: string | string[] }; if (typeof body.message === 'string') return body.message; if (Array.isArray(body.message)) return body.message.join(' '); } catch { /* fallback */ }
  return fallback;
}
