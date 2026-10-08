import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { EmailSignatureRecord } from '@wrx/shared';
import { Modal } from '../components/Modal';
import { EmailSignatureArtwork } from '../components/EmailSignatureArtwork';
import { useDeleteEmailSignature, useEmailSignatureAssets, useEmailSignatures } from '../hooks/useEmailSignatures';
import '../styles/email-signatures.css';

export function EmailSignaturesPage() {
  const query = useEmailSignatures();
  const assets = useEmailSignatureAssets();
  const remove = useDeleteEmailSignature();
  const [pending, setPending] = useState<EmailSignatureRecord | null>(null);
  const [error, setError] = useState('');
  const confirmDelete = async () => {
    if (!pending) return;
    setError('');
    try { await remove.mutateAsync(pending.id); setPending(null); }
    catch { setError('La signature n’a pas pu être supprimée. Réessayez.'); }
  };

  return <div className="tool-page email-signature-page">
    <header className="es-page-heading">
      <div><span className="es-kicker">IDENTITÉ · CORRESPONDANCE</span><h1>Signatures email<span>.</span></h1><p>Une identité cohérente, prête à accompagner vos messages.</p></div>
      <Link className="btn btn-primary" to="/email-signatures/new"><Plus size={17} /> Nouvelle signature</Link>
    </header>
    {query.isLoading && <div className="es-state" role="status">Chargement de vos signatures…</div>}
    {query.isError && <div className="es-state" role="alert"><p>Impossible de charger vos signatures.</p><button type="button" className="es-link-button" onClick={() => void query.refetch()}><RefreshCw size={15}/> Réessayer</button></div>}
    {!query.isLoading && !query.isError && !query.data?.length && <section className="es-empty"><div className="es-empty-mark"><Mail size={21}/></div><span className="es-kicker">VOTRE IDENTITÉ, DANS CHAQUE MESSAGE</span><h2>La bonne signature commence par vos informations.</h2><p>Créez une signature indépendante de votre profil, ajustez les champs visibles et choisissez une composition sobre.</p><Link className="btn btn-primary" to="/email-signatures/new">Créer ma première signature <ArrowUpRight size={16}/></Link></section>}
    {!!query.data?.length && <div className="es-library">{query.data.map((signature, index) => <article className="es-library-row" key={signature.id}>
      <span className="es-index">{String(index + 1).padStart(2, '0')}</span>
      <div className="es-library-preview"><EmailSignatureArtwork document={signature.document} assets={assets.data ?? []} compact/></div>
      <div className="es-library-copy"><span className="es-kicker">{signature.document.templateId.toUpperCase()} · EMAIL</span><h2>{signature.title}</h2><p>{signature.document.identity.fullName || 'Identité sans nom'}{signature.document.identity.company ? ` · ${signature.document.identity.company}` : ''}</p><small>Modifiée le {new Date(signature.updatedAt).toLocaleDateString('fr-FR')}</small></div>
      <div className="es-row-actions"><Link className="es-link-button" to={`/email-signatures/${signature.id}/edit`}>Modifier <ArrowUpRight size={15}/></Link><button className="es-delete-button" type="button" aria-label={`Supprimer ${signature.title}`} onClick={() => { setPending(signature); setError(''); }}><Trash2 size={16}/></button></div>
    </article>)}</div>}
    <Modal isOpen={!!pending} onClose={() => !remove.isPending && setPending(null)} title="Supprimer cette signature ?">
      <p>« {pending?.title} » sera supprimée de votre espace. Les images publiées restent disponibles tant qu’elles sont gérées dans votre bibliothèque d’images.</p>
      {error && <p className="es-error" role="alert">{error}</p>}
      <div className="es-modal-actions"><button className="btn btn-outline" type="button" disabled={remove.isPending} onClick={() => setPending(null)}>Annuler</button><button className="btn es-danger" type="button" disabled={remove.isPending} onClick={() => void confirmDelete()}>{remove.isPending ? 'Suppression…' : 'Supprimer'}</button></div>
    </Modal>
  </div>;
}
