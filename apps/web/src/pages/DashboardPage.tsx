import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useLinks } from '../hooks/useLinks';
import { useQRCodes } from '../hooks/useQR';
import { useBusinessCards } from '../hooks/useBusinessCards';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import { LinkCard } from '../components/LinkCard';
import { QRCard } from '../components/QRCard';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { BusinessCardArtwork } from '../components/BusinessCardPreview';
import { ToolDirectory } from '../components/ProductPrimitives';
import type { BusinessCardRecord } from '@wrx/shared';

function RecentBusinessCard({ card }: { card: BusinessCardRecord }) {
  const updatedAt = new Date(card.updatedAt);
  const details = [card.document.identity.fullName, card.document.identity.company].filter(Boolean).join(' · ');
  return <Link to={`/business-cards/${card.id}/edit`} className="dashboard-card-row" aria-label={`Modifier ${card.title}`}>
    <span className="dashboard-card-art" aria-hidden="true"><BusinessCardArtwork document={card.document} side="front" /></span>
    <span className="dashboard-card-copy">
      <span className="dashboard-card-kind eyebrow">CARTE / {card.templateKey}</span>
      <strong>{card.title}</strong>
      <small>{details || 'Identité enregistrée'}</small>
      <time dateTime={updatedAt.toISOString()}>Modifiée le {updatedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</time>
    </span>
    <ArrowUpRight className="dashboard-card-open" size={17} aria-hidden="true" />
  </Link>;
}

export function DashboardPage() {
  const { profile } = useAuthStore();
  const { data: links, isLoading: linksLoading, isError: linksError } = useLinks({ limit: 5 });
  const { data: qr, isLoading: qrLoading, isError: qrError } = useQRCodes({ limit: 5 });
  const { data: businessCards = [], isLoading: cardsLoading, isError: cardsError, refetch: refetchCards } = useBusinessCards();
  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'all', 'dashboard'],
    queryFn: () => api.get<{ overview: { totalClicks: number; totalScans: number } }>('/analytics?timeRange=all'),
  });
  const recentCards = [...businessCards].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);
  return <div className="dashboard-studio">
    <header className="dashboard-heading">
      <div><span className="eyebrow">ESPACE PERSONNEL / 05 OUTILS</span><h1>Votre espace<br /><span>de travail.</span></h1><p>{profile?.fullName ? `Bonjour ${profile.fullName.split(' ')[0]}. ` : ''}Accédez à un outil ou reprenez une création.</p></div>
      <div className="dashboard-principle" aria-label="Créer, partager, sécuriser, mesurer"><span>CRÉER</span><span>PARTAGER</span><span>SÉCURISER</span><span>MESURER</span></div>
    </header>
    <ToolDirectory />
    <section className="activity-overview" aria-label="Activité du compte"><div className="activity-intro"><span className="eyebrow">Votre activité</span><Link to="/analytics">Lire les signaux <ArrowUpRight size={16} /></Link></div>
      {[
        { label: 'Liens créés', value: links?.total, loading: linksLoading, error: linksError },
        { label: 'QR codes', value: qr?.total, loading: qrLoading, error: qrError },
        { label: 'Cartes enregistrées', value: businessCards.length, loading: cardsLoading, error: cardsError },
        { label: 'Clics enregistrés', value: analytics?.overview.totalClicks, loading: isLoading, error: isError },
        { label: 'Scans enregistrés', value: analytics?.overview.totalScans, loading: isLoading, error: isError },
      ].map(item => <div key={item.label} className="activity-number"><strong>{item.loading ? '…' : item.error ? '—' : <AnimatedNumber value={item.value ?? 0} />}</strong><span>{item.label}</span></div>)}
    </section>
    <section className="recent-studio"><div className="section-heading"><div><span className="eyebrow">VOTRE ESPACE</span><h2>Reprendre une création</h2></div><Link to="/business-cards">Toutes les cartes <ArrowRight size={16} /></Link></div>
      <div className="recent-columns"><div><div className="collection-heading"><span>01 / Liens courts</span><Link to="/links" aria-label="Voir tous les liens"><ArrowUpRight size={18} /></Link></div>
        {linksLoading ? <div className="studio-skeleton" /> : linksError ? <p className="studio-empty">Les liens n’ont pas pu être chargés.</p> : !links?.data.length ? <div className="studio-empty"><p>Votre première destination commence ici.</p><Link to="/links/new">Créer un lien <ArrowRight size={16} /></Link></div> : links.data.slice(0, 3).map(link => <LinkCard key={link.id} link={link} />)}
      </div><div><div className="collection-heading"><span>02 / QR codes</span><Link to="/qr-codes" aria-label="Voir tous les QR codes"><ArrowUpRight size={18} /></Link></div>
        {qrLoading ? <div className="studio-skeleton" /> : qrError ? <p className="studio-empty">Les QR codes n’ont pas pu être chargés.</p> : !qr?.data.length ? <div className="studio-empty"><p>Faites passer votre contenu dans le monde réel.</p><Link to="/qr-codes/new">Créer un QR code <ArrowRight size={16} /></Link></div> : qr.data.slice(0, 3).map(code => <QRCard key={code.id} qr={code} />)}
      </div><div><div className="collection-heading"><span>03 / Cartes de visite</span><Link to="/business-cards" aria-label="Voir toutes les cartes de visite"><ArrowUpRight size={18} /></Link></div>
        {cardsLoading ? <div className="studio-skeleton" /> : cardsError ? <div className="studio-empty" role="alert"><p>Les cartes n’ont pas pu être chargées.</p><button type="button" className="dashboard-retry" onClick={() => void refetchCards()}>Réessayer</button></div> : !recentCards.length ? <div className="studio-empty"><p>Créez une carte à partir de votre identité.</p><Link to="/business-cards/new">Créer une carte <ArrowRight size={16} /></Link></div> : recentCards.map(card => <RecentBusinessCard key={card.id} card={card} />)}
      </div></div>
    </section>
  </div>;
}
