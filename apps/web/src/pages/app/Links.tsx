import { useEffect, useState } from 'react';
import { Link as RLink, useNavigate, useSearchParams } from 'react-router';
import {
  Archive,
  BarChart3,
  FileUp,
  Link2,
  Lock,
  MoreHorizontal,
  Pencil,
  QrCode,
  Search,
  Split,
  Timer,
  Trash2,
  Smartphone,
} from 'lucide-react';
import type { Link } from '@wrx/shared';
import { useT } from '@/lib/i18n';
import { compact, hostOf, relTime } from '@/lib/format';
import { parseCsv } from '@/lib/csv';
import { useLinkMutations, useLinks } from '@/hooks/queries';
import { LinkEditor } from '@/components/LinkEditor';
import {
  Badge,
  Button,
  CopyButton,
  Dialog,
  Empty,
  ErrorState,
  Input,
  ModuleLoader,
  PageHeader,
  Segmented,
  Select,
  cx,
  useToast,
} from '@/components/ui';

export function QuickCreate({ open, onClose, link }: { open: boolean; onClose: () => void; link?: Link }) {
  const { t } = useT();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={link ? t('Edit /{slug}', { slug: link.slug }) : t('Create a link')}
      side
    >
      <LinkEditor link={link} onDone={onClose} />
    </Dialog>
  );
}

export default function Links() {
  const { t, lang } = useT();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [sort, setSort] = useState('recent');
  const [editing, setEditing] = useState<Link | undefined>();
  const [creating, setCreating] = useState(params.get('new') === '1');
  const [importing, setImporting] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(id);
  }, [q]);
  const list = useLinks({ q: debounced, tag, status, sort, limit: 100 });

  return (
    <>
      <PageHeader
        title={t('Links')}
        subtitle={list.data ? t('{n} links', { n: list.data.total }) : undefined}
        actions={
          <>
            <Button variant="secondary" onClick={() => setImporting(true)}>
              <FileUp className="size-4" />
              {t('Import CSV')}
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Link2 className="size-4" />
              {t('Create a link')}
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <Input
            leading={<Search className="size-4" />}
            placeholder={t('Search by name, title or destination')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t('Search links')}
          />
        </div>
        {!!list.data?.tags.length && (
          <Select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label={t('Filter by tag')}
            className="w-auto"
          >
            <option value="">{t('All tags')}</option>
            {list.data.tags.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        )}
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label={t('Sort')}
          className="w-auto"
        >
          <option value="recent">{t('Newest first')}</option>
          <option value="clicks">{t('Most clicked')}</option>
          <option value="alpha">{t('A to Z')}</option>
        </Select>
        <Segmented
          label={t('Status')}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: t('Active') },
            { value: 'archived', label: t('Archived') },
          ]}
        />
      </div>
      {list.error ? (
        <ErrorState error={list.error} retry={() => list.refetch()} />
      ) : !list.data ? (
        <ModuleLoader />
      ) : list.data.items.length ? (
        <ul className="card divide-y divide-line">
          {list.data.items.map((l) => (
            <LinkRow key={l.id} l={l} lang={lang} onEdit={() => setEditing(l)} />
          ))}
        </ul>
      ) : (
        <Empty
          icon={<Link2 />}
          title={
            debounced || tag
              ? t('No link matches this search')
              : status === 'archived'
                ? t('Nothing archived')
                : t('Create your first short link')
          }
          body={
            debounced || tag
              ? t('Try another word or clear the filters.')
              : t('Paste a long URL and get a short one you can share, track and turn into a QR code.')
          }
          action={
            !debounced &&
            !tag &&
            status === 'active' && <Button onClick={() => setCreating(true)}>{t('Create a link')}</Button>
          }
        />
      )}
      <QuickCreate
        open={creating || !!editing}
        link={editing}
        onClose={() => {
          setCreating(false);
          setEditing(undefined);
          if (params.has('new')) setParams({}, { replace: true });
        }}
      />
      <ImportDialog open={importing} onClose={() => setImporting(false)} />
    </>
  );
}

function LinkRow({ l, lang, onEdit }: { l: Link; lang: string; onEdit: () => void }) {
  const { t } = useT();
  const nav = useNavigate();
  const toast = useToast();
  const { update, remove } = useLinkMutations();
  const [menu, setMenu] = useState(false);
  const expired = l.expiresAt && Date.parse(l.expiresAt) < Date.now();
  return (
    <li className="group relative flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <RLink
            to={`/app/links/${l.id}`}
            className="truncate font-mono text-[14.5px] font-semibold hover:text-accent"
          >
            /{l.slug}
          </RLink>
          {l.hasPassword && (
            <Lock className="size-3.5 shrink-0 text-faint" aria-label={t('Password protected')} />
          )}
          {!!l.rules.length && (
            <Smartphone className="size-3.5 shrink-0 text-faint" aria-label={t('Smart routing')} />
          )}
          {!!l.variants.length && (
            <Split className="size-3.5 shrink-0 text-faint" aria-label={t('A/B test')} />
          )}
          {(l.expiresAt || l.maxClicks) && (
            <Timer
              className={cx('size-3.5 shrink-0', expired ? 'text-coral' : 'text-faint')}
              aria-label={t('Limited')}
            />
          )}
        </div>
        <p className="truncate text-[13.5px] text-muted">
          {l.title ? (
            <>
              <span className="text-fg">{l.title}</span> —{' '}
            </>
          ) : null}
          {hostOf(l.url)}
        </p>
      </div>
      <div className="hidden flex-wrap gap-1 md:flex">
        {l.tags.slice(0, 2).map((x) => (
          <Badge key={x}>{x}</Badge>
        ))}
      </div>
      <RLink
        to={`/app/links/${l.id}`}
        className="flex w-20 items-center justify-end gap-1.5 text-[14px] tabular hover:text-accent"
        title={t('See analytics')}
      >
        <BarChart3 className="size-4 text-faint" />
        {compact(l.clicks, lang)}
      </RLink>
      <span className="hidden w-28 text-right text-[12.5px] text-faint lg:block">
        {relTime(l.createdAt, lang)}
      </span>
      <CopyButton value={l.shortUrl} />
      <div className="relative">
        <button
          onClick={() => setMenu(!menu)}
          onBlur={() => setTimeout(() => setMenu(false), 150)}
          className="grid size-8 place-items-center rounded-lg text-muted hover:bg-raised"
          aria-label={t('More actions')}
          aria-expanded={menu}
        >
          <MoreHorizontal className="size-4" />
        </button>
        {menu && (
          <div className="absolute right-0 top-9 z-20 grid w-48 gap-0.5 rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-lift)] [&_button]:flex [&_button]:h-9 [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-lg [&_button]:px-2.5 [&_button]:text-[13.5px] [&_button:hover]:bg-raised [&_svg]:size-4">
            <button onClick={onEdit}>
              <Pencil />
              {t('Edit')}
            </button>
            <button onClick={() => nav(`/app/qr?new=1&link=${l.id}`)}>
              <QrCode />
              {t('Make a QR code')}
            </button>
            <button
              onClick={() =>
                update.mutate(
                  { id: l.id, archived: !l.archived },
                  { onSuccess: () => toast(l.archived ? t('Link restored') : t('Link archived')) },
                )
              }
            >
              <Archive />
              {l.archived ? t('Restore') : t('Archive')}
            </button>
            <button
              className="text-coral"
              onClick={() => {
                if (
                  confirm(
                    t('Delete /{slug} and all of its analytics? This cannot be undone.', { slug: l.slug }),
                  )
                )
                  remove.mutate(l.id, { onSuccess: () => toast(t('Link deleted')) });
              }}
            >
              <Trash2 />
              {t('Delete')}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const { bulk } = useLinkMutations();
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [name, setName] = useState('');
  const close = () => {
    setRows(null);
    bulk.reset();
    onClose();
  };
  return (
    <Dialog open={open} onClose={close} title={t('Import links from a spreadsheet')}>
      {bulk.data ? (
        <div className="grid gap-3">
          <p className="text-[15px]">
            <b>{t('{n} links created.', { n: bulk.data.created })}</b>
          </p>
          {!!bulk.data.failed.length && (
            <ul className="max-h-48 overflow-auto rounded-lg bg-raised p-3 text-[13px]">
              {bulk.data.failed.map((f) => (
                <li key={f.row}>{t('Row {r}: {reason}', { r: f.row, reason: f.reason })}</li>
              ))}
            </ul>
          )}
          <Button onClick={close} className="justify-self-end">
            {t('Done')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          <p className="text-[14px] text-muted">
            {t(
              'Export a CSV with a header row. Required column: url. Optional: slug, title, tags (separate tags with |). Up to 500 rows.',
            )}
          </p>
          <pre className="rounded-lg bg-raised p-3 font-mono text-[12.5px]">
            url,slug,title,tags{'\n'}https://example.com/a,launch,Launch page,campaign|ig
          </pre>
          <label className="grid cursor-pointer place-items-center gap-1 rounded-[12px] border-2 border-dashed border-line px-4 py-8 text-center hover:border-accent">
            <FileUp className="size-6 text-accent" />
            <span className="font-medium">{name || t('Choose a CSV file')}</span>
            {rows && (
              <span className="text-[13px] text-muted">
                {t('{n} rows ready to import', { n: rows.length })}
              </span>
            )}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setName(f.name);
                setRows(parseCsv(await f.text()).filter((r) => r.url));
              }}
            />
          </label>
          {bulk.error && (
            <p role="alert" className="text-[13.5px] text-coral">
              {bulk.error.message}
            </p>
          )}
          <Button
            disabled={!rows?.length}
            loading={bulk.isPending}
            onClick={() => rows && bulk.mutate(rows.slice(0, 500))}
          >
            {rows ? t('Import {n} links', { n: Math.min(rows.length, 500) }) : t('Import')}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
