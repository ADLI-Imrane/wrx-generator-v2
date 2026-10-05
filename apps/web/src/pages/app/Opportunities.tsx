import { useState } from 'react';
import { Link } from 'react-router';
import { Briefcase, Eye, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { OPPORTUNITY_TYPES, type Opportunity, type OpportunityInput } from '@wrx/shared';
import { ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { relTime } from '@/lib/format';
import { useBioPages, useOpportunities, useOpportunityMutations } from '@/hooks/queries';
import {
  Badge,
  Button,
  CopyButton,
  Dialog,
  Empty,
  ErrorState,
  Field,
  Input,
  ModuleLoader,
  PageHeader,
  Select,
  Switch,
  Textarea,
  useToast,
} from '@/components/ui';
import { useOppTypeLabel } from '@/pages/public/Discover';

export default function Opportunities() {
  const { t, lang } = useT();
  const list = useOpportunities();
  const pages = useBioPages();
  const types = useOppTypeLabel();
  const { remove } = useOpportunityMutations();
  const toast = useToast();
  const [editing, setEditing] = useState<Opportunity | 'new' | null>(null);
  const noPage = pages.data && !pages.data.items.length;

  return (
    <>
      <PageHeader
        title={t('Opportunities')}
        subtitle={t(
          'Post a job, an internship, a freelance mission, a co-founder search, a partnership or a funding round. Answers arrive in your inbox.',
        )}
        actions={
          <Button disabled={!!noPage} onClick={() => setEditing('new')}>
            <Briefcase className="size-4" />
            {t('Post an opportunity')}
          </Button>
        }
      />
      {noPage && (
        <div className="card mb-4 p-4 text-[14px]">
          {t('Opportunities are published by a profile.')}{' '}
          <Link to="/app/profile" className="font-semibold text-accent">
            {t('Create your profile first')}
          </Link>
        </div>
      )}
      {list.error ? (
        <ErrorState error={list.error} />
      ) : !list.data ? (
        <ModuleLoader />
      ) : list.data.items.length ? (
        <ul className="grid gap-3">
          {list.data.items.map((o) => (
            <li key={o.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{o.title}</h2>
                  <Badge tone={o.status === 'open' ? 'mint' : 'neutral'}>
                    {o.status === 'open' ? t('Open') : t('Closed')}
                  </Badge>
                  <Badge tone="route">{types[o.type]}</Badge>
                </div>
                <p className="text-[13px] text-muted">
                  @{o.publisher.handle} — {t('posted {when}', { when: relTime(o.createdAt, lang) })}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[13.5px] tabular text-muted">
                <Eye className="size-4" />
                {o.views}
              </span>
              <Link
                to="/app/inbox"
                className="inline-flex items-center gap-1 text-[13.5px] tabular hover:text-accent"
              >
                <MessageSquare className="size-4" />
                {t('{n} responses', { n: o.responses })}
              </Link>
              <CopyButton value={o.publicUrl} label={t('Copy link')} />
              <Button size="sm" variant="ghost" aria-label={t('Edit')} onClick={() => setEditing(o)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t('Delete')}
                className="hover:text-coral"
                onClick={() =>
                  confirm(t('Delete this opportunity?')) &&
                  remove.mutate(o.id, { onSuccess: () => toast(t('Opportunity deleted')) })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        !noPage && (
          <Empty
            icon={<Briefcase />}
            title={t('Nothing posted yet')}
            body={t(
              'Opportunities appear on your profile and in the Discover directory, with a shareable short link.',
            )}
            action={<Button onClick={() => setEditing('new')}>{t('Post an opportunity')}</Button>}
          />
        )
      )}
      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t('Post an opportunity') : t('Edit opportunity')}
        side
      >
        {editing && <OppForm o={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Dialog>
    </>
  );
}

function OppForm({ o, onDone }: { o?: Opportunity; onDone: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const pages = useBioPages();
  const types = useOppTypeLabel();
  const { save } = useOpportunityMutations();
  const [f, setF] = useState<OpportunityInput>({
    pageId: o?.publisher.id ?? pages.data?.items[0]?.id ?? '',
    type: o?.type ?? 'job',
    title: o?.title ?? '',
    location: o?.location ?? '',
    remote: o?.remote ?? false,
    description: o?.description ?? '',
    tags: o?.tags ?? [],
    status: o?.status ?? 'open',
  });
  const [tags, setTags] = useState(f.tags.join(', '));
  const fields = save.error instanceof ApiError ? save.error.fields : {};
  const set = <K extends keyof OpportunityInput>(k: K, v: OpportunityInput[K]) =>
    setF((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(
          {
            ...f,
            id: o?.id,
            tags: tags
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean),
          },
          {
            onSuccess: () => {
              toast(o ? t('Opportunity saved') : t('Opportunity published'));
              onDone();
            },
          },
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('Published by')} htmlFor="o-page">
          <Select id="o-page" value={f.pageId} onChange={(e) => set('pageId', e.target.value)}>
            {pages.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (@{p.handle})
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('Type')} htmlFor="o-type">
          <Select
            id="o-type"
            value={f.type}
            onChange={(e) => set('type', e.target.value as OpportunityInput['type'])}
          >
            {OPPORTUNITY_TYPES.map((x) => (
              <option key={x} value={x}>
                {types[x]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t('Title')} htmlFor="o-title" error={fields.title}>
        <Input
          id="o-title"
          placeholder={t('Backend engineer (Node.js)')}
          value={f.title}
          onChange={(e) => set('title', e.target.value)}
          invalid={!!fields.title}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('Location')} htmlFor="o-loc">
          <Input
            id="o-loc"
            placeholder="Casablanca"
            value={f.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </Field>
        <Field label={t('Tags')} htmlFor="o-tags" hint={t('Separate with commas.')}>
          <Input
            id="o-tags"
            placeholder="React, Junior"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </Field>
      </div>
      <Switch checked={f.remote} onChange={(v) => set('remote', v)} label={t('Remote possible')} />
      <Field
        label={t('Description')}
        htmlFor="o-desc"
        error={fields.description}
        hint={t('What the person will do, what you offer, and how you decide.')}
      >
        <Textarea
          id="o-desc"
          rows={8}
          value={f.description}
          onChange={(e) => set('description', e.target.value)}
          invalid={!!fields.description}
        />
      </Field>
      <Switch
        checked={f.status === 'open'}
        onChange={(v) => set('status', v ? 'open' : 'closed')}
        label={t('Accepting responses')}
        description={t('Close it when the position is filled; the page stays online.')}
      />
      {save.error && !Object.keys(fields).length && (
        <p role="alert" className="text-[13.5px] text-coral">
          {save.error.message}
        </p>
      )}
      <Button type="submit" loading={save.isPending}>
        {o ? t('Save changes') : t('Publish')}
      </Button>
    </form>
  );
}
