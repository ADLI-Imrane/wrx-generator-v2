import { useState } from 'react';
import { Link as RLink, useParams } from 'react-router';
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { shortDate } from '@/lib/format';
import { useLink } from '@/hooks/queries';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { Badge, Button, CopyButton, ErrorState, ModuleLoader } from '@/components/ui';
import { QuickCreate } from './Links';

export default function LinkDetail() {
  const { id = '' } = useParams();
  const { t, lang } = useT();
  const q = useLink(id);
  const [edit, setEdit] = useState(false);
  if (q.error) return <ErrorState error={q.error} />;
  if (!q.data) return <ModuleLoader />;
  const l = q.data;
  return (
    <>
      <RLink
        to="/app/links"
        className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        {t('All links')}
      </RLink>
      <div className="card mb-6 flex flex-wrap items-center gap-4 p-5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-mono text-[24px] font-semibold">
            {l.shortUrl.replace(/^https?:\/\//, '')}
          </h1>
          <a
            href={l.url}
            target="_blank"
            rel="noopener"
            className="inline-flex max-w-full items-center gap-1 truncate text-[14px] text-muted hover:text-accent"
          >
            {l.url}
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {l.title && <Badge tone="route">{l.title}</Badge>}
            {l.tags.map((x) => (
              <Badge key={x}>{x}</Badge>
            ))}
            <Badge>{t('Created {d}', { d: shortDate(l.createdAt, lang) })}</Badge>
          </div>
        </div>
        <CopyButton value={l.shortUrl} />
        <RLink to={`/app/qr?new=1&link=${l.id}`}>
          <Button variant="secondary" size="sm">
            {t('Make a QR code')}
          </Button>
        </RLink>
        <Button size="sm" onClick={() => setEdit(true)}>
          <Pencil className="size-3.5" />
          {t('Edit')}
        </Button>
      </div>
      <AnalyticsPanel linkId={l.id} />
      <QuickCreate open={edit} link={l} onClose={() => setEdit(false)} />
    </>
  );
}
