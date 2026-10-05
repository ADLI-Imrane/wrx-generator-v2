import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Wifi, Eye } from 'lucide-react';
import type { Opportunity } from '@wrx/shared';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { relTime } from '@/lib/format';
import { Badge, ModuleLoader } from '@/components/ui';
import { ContactForm } from '@/components/ContactForm';
import { Avatar, useOppTypeLabel } from './Discover';
import NotFound from './NotFound';

export default function OpportunityPage() {
  const { id = '' } = useParams();
  const { t, lang } = useT();
  const types = useOppTypeLabel();
  const q = useQuery({
    queryKey: ['public-opp', id],
    queryFn: () => api<Opportunity>(`/public/opportunities/${id}`),
    retry: false,
  });
  if (q.isPending) return <ModuleLoader className="min-h-[60vh]" />;
  if (!q.data) return <NotFound />;
  const o = q.data;
  return (
    <main className="mx-auto grid max-w-[1100px] gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[1.3fr_1fr]">
      <article className="grid content-start gap-5">
        <Link to={`/b/${o.publisher.handle}`} className="flex items-center gap-3 text-muted hover:text-fg">
          <Avatar src={o.publisher.avatar} name={o.publisher.title} kind={o.publisher.kind} size={40} />
          <span className="font-medium">{o.publisher.title}</span>
        </Link>
        <h1 className="text-[36px] font-semibold">{o.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-muted">
          <Badge tone={o.type === 'investment' || o.type === 'cofounder' ? 'signal' : 'route'}>
            {types[o.type]}
          </Badge>
          {o.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" />
              {o.location}
            </span>
          )}
          {o.remote && (
            <span className="inline-flex items-center gap-1">
              <Wifi className="size-4" />
              {t('Remote possible')}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Eye className="size-4" />
            {t('{n} views', { n: o.views })}
          </span>
          <span>{t('Posted {when}', { when: relTime(o.createdAt, lang) })}</span>
        </div>
        <div className="whitespace-pre-line text-[15.5px] leading-relaxed">{o.description}</div>
        {!!o.tags.length && (
          <div className="flex flex-wrap gap-1.5">
            {o.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
      </article>
      <aside className="card h-fit p-6 lg:sticky lg:top-24">
        {o.status === 'open' ? (
          <>
            <h2 className="mb-1 text-[18px] font-semibold">
              {o.type === 'investment' ? t('Introduce your startup') : t('Respond to this opportunity')}
            </h2>
            <p className="mb-5 text-[13.5px] text-muted">
              {t('Your message goes straight to {name}.', { name: o.publisher.title })}
            </p>
            <ContactForm
              handle={o.publisher.handle}
              opportunityId={o.id}
              defaultIntent={
                o.type === 'investment' ? 'investment' : o.type === 'partnership' ? 'partnership' : 'job'
              }
            />
          </>
        ) : (
          <p className="text-muted">{t('This opportunity is closed.')}</p>
        )}
      </aside>
    </main>
  );
}
