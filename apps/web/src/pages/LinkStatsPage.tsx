import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Clipboard, Globe2, Monitor, Smartphone } from 'lucide-react';
import { useLink, useLinkStats } from '../hooks/useLinks';

type Breakdown = Record<string, number>;

function BreakdownList({ title, values, icon: Icon }: { title: string; values: Breakdown; icon?: typeof Globe2 }) {
  const rows = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  return <section className="card">
    <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">{Icon && <Icon size={18} />}{title}</h2>
    {rows.length === 0 ? <p className="text-sm text-slate-500">Aucune donnée pour le moment.</p> : <ul className="space-y-3">
      {rows.map(([label, count]) => <li key={label}>
        <div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate">{label}</span><span className="font-medium tabular-nums">{count} <span className="text-slate-500">({total ? Math.round(count / total * 100) : 0}%)</span></span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-700" style={{ width: `${total ? count / total * 100 : 0}%` }} /></div>
      </li>)}
    </ul>}
  </section>;
}

export function LinkStatsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: link, isLoading: linkLoading, error: linkError } = useLink(id);
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useLinkStats(id, 'all');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (linkLoading) return <div className="flex min-h-96 items-center justify-center text-slate-500">Chargement du lien…</div>;
  if (linkError || !link) return <div role="alert" className="rounded-xl bg-red-50 p-6 text-center text-red-800"><h2 className="font-semibold">Lien non trouvé</h2><Link className="btn btn-primary mt-4 inline-flex" to="/links">Retour aux liens</Link></div>;

  const events = stats?.recentClicks || [];
  const daily = new Map<string, number>();
  for (const event of events) {
    const day = event.clicked_at.slice(0, 10);
    daily.set(day, (daily.get(day) || 0) + 1);
  }
  const dailyRows = [...daily].sort(([a], [b]) => a.localeCompare(b));
  const maxDay = Math.max(...dailyRows.map(([, count]) => count), 1);

  return <div className="resource-stats mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <Link to="/links" aria-label="Retour aux liens" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft size={20} /></Link>
        <div className="min-w-0">
          <p className="text-sm text-slate-500">Statistiques du lien</p>
          <h1 className="truncate text-2xl font-bold text-slate-900">{link.title || link.slug}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <code className="rounded bg-slate-100 px-2 py-1 text-cyan-800">{link.shortUrl}</code>
            <button type="button" aria-label={copied ? "Lien copié" : "Copier le lien court"} className="rounded p-1 text-slate-500 hover:bg-slate-100" onClick={() => void copy()}>{copied ? <Check size={16} /> : <Clipboard size={16} />}</button>
            <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir la destination" className="rounded p-1 text-slate-500 hover:bg-slate-100"><ArrowUpRight size={16} /></a>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Link to={`/links/${id}/edit`} className="btn btn-outline">Modifier</Link>
      </div>
    </header>

    {statsError ? <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800"><p>Impossible de charger les statistiques.</p><button className="mt-2 underline" onClick={() => void refetch()}>Réessayer</button></div> : <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-slate-500">Clics au total</p><p className="mt-1 text-3xl font-bold text-slate-900">{statsLoading ? '…' : (stats?.totalClicks || 0).toLocaleString()}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Visiteurs distincts</p><p className="mt-1 text-3xl font-bold text-slate-900">{statsLoading ? '…' : (stats?.uniqueClicks || 0).toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">Sur les 100 clics les plus récents</p></div>
        <div className="card"><p className="text-sm text-slate-500">Créé le</p><p className="mt-1 text-xl font-bold text-slate-900">{new Date(link.createdAt).toLocaleDateString('fr-FR')}</p></div>
      </div>

      <section className="card">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-semibold text-slate-900">Activité récente</h2><p className="text-xs text-slate-500">Jusqu’aux 100 clics les plus récents · heure du clic</p></div>
        {statsLoading ? <p className="text-sm text-slate-500">Chargement…</p> : dailyRows.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Aucun clic enregistré.</p> : <>
          <div className="flex h-44 items-end gap-1" role="img" aria-label="Nombre de clics récents par jour">
            {dailyRows.map(([day, count]) => <div key={day} className="group relative h-full flex-1" title={`${day} : ${count} clics`}><div className="w-full rounded-t bg-cyan-700" style={{ height: `${count / maxDay * 100}%`, minHeight: 3 }} /><span className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">{day} · {count}</span></div>)}
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{dailyRows[0]?.[0]}</span><span>{dailyRows[dailyRows.length - 1]?.[0]}</span></div>
        </>}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <BreakdownList title="Pays" values={stats?.byCountry || {}} icon={Globe2} />
        <BreakdownList title="Appareils" values={stats?.byDevice || {}} icon={Smartphone} />
        <BreakdownList title="Navigateurs" values={stats?.byBrowser || {}} icon={Monitor} />
        <BreakdownList title="Sources" values={stats?.byReferrer || {}} />
      </div>
    </>}
  </div>;
}
