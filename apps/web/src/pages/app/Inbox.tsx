import { useState } from 'react';
import { Inbox as InboxIcon, Mail, Trash2, ExternalLink } from 'lucide-react';
import { CONTACT_STATUSES, type ContactRequest } from '@wrx/shared';
import { useT } from '@/lib/i18n';
import { relTime } from '@/lib/format';
import { useInbox, useInboxMutations } from '@/hooks/queries';
import {
  Badge,
  Button,
  Empty,
  ErrorState,
  ModuleLoader,
  PageHeader,
  Segmented,
  Select,
  cx,
} from '@/components/ui';

export default function Inbox() {
  const { t, lang } = useT();
  const [status, setStatus] = useState<'' | ContactRequest['status']>('');
  const q = useInbox(status || undefined);
  const all = useInbox();
  const { setStatus: mark, remove } = useInboxMutations();
  const [open, setOpen] = useState<string | null>(null);
  const counts = all.data?.counts ?? {};
  const statusLabel = { new: t('New'), in_progress: t('In progress'), closed: t('Done') } as const;
  const intentLabel: Record<ContactRequest['intent'], string> = {
    collaboration: t('Collaboration'),
    hiring: t('Wants to hire you'),
    job: t('Application'),
    partnership: t('Partnership'),
    investment: t('Investment'),
    mentoring: t('Mentoring'),
    other: t('Other'),
  };
  const current = q.data?.items.find((r) => r.id === open) ?? q.data?.items[0];

  return (
    <>
      <PageHeader
        title={t('Inbox')}
        subtitle={t('Introductions, applications and proposals sent from your profile and opportunities.')}
      />
      <div className="mb-4">
        <Segmented
          label={t('Filter')}
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: t('All') },
            ...CONTACT_STATUSES.map((s) => ({
              value: s,
              label: `${statusLabel[s]}${counts[s] ? ` (${counts[s]})` : ''}`,
            })),
          ]}
        />
      </div>
      {q.error ? (
        <ErrorState error={q.error} />
      ) : !q.data ? (
        <ModuleLoader />
      ) : !q.data.items.length ? (
        <Empty
          icon={<InboxIcon />}
          title={status ? t('Nothing here') : t('No messages yet')}
          body={t('Share your profile link or QR card — messages people send through it land here.')}
        />
      ) : (
        <div className="card grid overflow-hidden lg:grid-cols-[360px_1fr]">
          <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto border-line lg:border-r">
            {q.data.items.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setOpen(r.id)}
                  className={cx(
                    'grid w-full gap-1 px-4 py-3 text-left transition hover:bg-raised',
                    current?.id === r.id && 'bg-raised',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {r.status === 'new' && (
                      <span className="size-2 shrink-0 rounded-full bg-signal" aria-label={t('New')} />
                    )}
                    <span className="truncate font-semibold">{r.name}</span>
                    <span className="ml-auto shrink-0 text-[12px] text-faint">
                      {relTime(r.createdAt, lang)}
                    </span>
                  </div>
                  <span className="truncate text-[13px] text-muted">
                    {intentLabel[r.intent]}
                    {r.opportunity ? ` — ${r.opportunity.title}` : ''}
                  </span>
                  <span className="line-clamp-1 text-[13px] text-faint">{r.message}</span>
                </button>
              </li>
            ))}
          </ul>
          {current && (
            <article className="grid content-start gap-5 p-6">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[22px] font-semibold">{current.name}</h2>
                  <p className="text-[14px] text-muted">
                    {current.company && `${current.company} — `}
                    <a className="hover:text-accent" href={`mailto:${current.email}`}>
                      {current.email}
                    </a>
                  </p>
                </div>
                <Select
                  value={current.status}
                  onChange={(e) =>
                    mark.mutate({ id: current.id, status: e.target.value as ContactRequest['status'] })
                  }
                  aria-label={t('Status')}
                  className="w-auto"
                >
                  {CONTACT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="route">{intentLabel[current.intent]}</Badge>
                {current.opportunity && <Badge tone="signal">{current.opportunity.title}</Badge>}
                <Badge>@{current.page.handle}</Badge>
              </div>
              <p className="whitespace-pre-line rounded-xl bg-raised p-4 text-[15px] leading-relaxed">
                {current.message}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${current.email}?subject=${encodeURIComponent(`Re: ${current.opportunity?.title ?? t('your message')}`)}`}
                  onClick={() =>
                    current.status === 'new' && mark.mutate({ id: current.id, status: 'in_progress' })
                  }
                >
                  <Button>
                    <Mail className="size-4" />
                    {t('Reply by email')}
                  </Button>
                </a>
                {current.profileUrl && (
                  <a href={current.profileUrl} target="_blank" rel="noopener">
                    <Button variant="secondary">
                      <ExternalLink className="size-4" />
                      {t('Their profile')}
                    </Button>
                  </a>
                )}
                <Button
                  variant="ghost"
                  className="ml-auto hover:text-coral"
                  onClick={() =>
                    confirm(t('Delete this message?')) &&
                    remove.mutate(current.id, { onSuccess: () => setOpen(null) })
                  }
                >
                  <Trash2 className="size-4" />
                  {t('Delete')}
                </Button>
              </div>
            </article>
          )}
        </div>
      )}
    </>
  );
}
