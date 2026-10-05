import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Download, ImagePlus, Pencil, QrCode, Trash2, X } from 'lucide-react';
import {
  QR_CORNERS,
  QR_DOTS,
  QR_FRAMES,
  QrDesignSchema,
  type QrCode as Qr,
  type QrDesign,
} from '@wrx/shared';
import { ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { hostOf, nf } from '@/lib/format';
import { useLinks, useQrCodes, useQrMutations } from '@/hooks/queries';
import { QrPreview, downloadQr } from '@/components/QrPreview';
import {
  Button,
  Dialog,
  Empty,
  ErrorState,
  Field,
  Input,
  ModuleLoader,
  PageHeader,
  Segmented,
  Select,
  Switch,
  cx,
  useToast,
} from '@/components/ui';

const PRESETS: { name: string; d: Partial<QrDesign> }[] = [
  { name: 'Ink', d: { fg: '#14213D', bg: '#FFFFFF', gradient: null } },
  { name: 'Route', d: { fg: '#14213D', bg: '#FFFFFF', gradient: { to: '#3A5BFF', rotation: 45 } } },
  { name: 'Signal', d: { fg: '#14213D', bg: '#FFF4CC', gradient: null } },
  { name: 'Mint', d: { fg: '#0B6E5B', bg: '#E9FBF6', gradient: { to: '#12A383', rotation: 90 } } },
  { name: 'Night', d: { fg: '#FFB703', bg: '#14213D', gradient: null } },
  { name: 'Coral', d: { fg: '#7A1F22', bg: '#FFF1F1', gradient: { to: '#E5484D', rotation: 135 } } },
];

export default function QrStudio() {
  const { t, lang } = useT();
  const [params, setParams] = useSearchParams();
  const list = useQrCodes();
  const { remove } = useQrMutations();
  const toast = useToast();
  const [editing, setEditing] = useState<Qr | 'new' | null>(params.get('new') ? 'new' : null);
  const close = () => {
    setEditing(null);
    if (params.has('new')) setParams({}, { replace: true });
  };

  return (
    <>
      <PageHeader
        title={t('QR codes')}
        subtitle={t('Every code is dynamic: change its destination later without reprinting it.')}
        actions={
          <Button onClick={() => setEditing('new')}>
            <QrCode className="size-4" />
            {t('Design a QR code')}
          </Button>
        }
      />
      {list.error ? (
        <ErrorState error={list.error} />
      ) : !list.data ? (
        <ModuleLoader />
      ) : list.data.items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.data.items.map((q) => (
            <article key={q.id} className="card grid gap-4 p-5">
              <div className="grid place-items-center rounded-xl bg-raised py-6">
                <QrPreview data={q.encodedUrl} design={q.design} size={150} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-semibold">{q.name}</h2>
                <p className="truncate text-[13px] text-muted">
                  <span className="font-mono">/{q.slug}</span> — {hostOf(q.destination)}
                </p>
                <p className="mt-1 text-[13px] tabular">{t('{n} scans', { n: nf(q.scans, lang) })}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadQr(q.encodedUrl, q.design, q.name, 'png')}
                >
                  <Download className="size-3.5" />
                  PNG
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadQr(q.encodedUrl, q.design, q.name, 'svg')}
                >
                  <Download className="size-3.5" />
                  SVG
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(q)} aria-label={t('Edit')}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto hover:text-coral"
                  aria-label={t('Delete')}
                  onClick={() =>
                    confirm(
                      t('Delete this QR code? Printed copies will keep working through the short link.'),
                    ) && remove.mutate(q.id, { onSuccess: () => toast(t('QR code deleted')) })
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={<QrCode />}
          title={t('Design your first QR code')}
          body={t('Pick colours, add your logo and a frame, then download it for print or screens.')}
          action={<Button onClick={() => setEditing('new')}>{t('Design a QR code')}</Button>}
        />
      )}
      <Dialog
        open={!!editing}
        onClose={close}
        title={editing === 'new' ? t('New QR code') : t('Edit QR code')}
        size="lg"
      >
        {editing && (
          <Designer
            qr={editing === 'new' ? undefined : editing}
            initialLink={params.get('link') ?? undefined}
            onDone={close}
          />
        )}
      </Dialog>
    </>
  );
}

function Designer({ qr, initialLink, onDone }: { qr?: Qr; initialLink?: string; onDone: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const links = useLinks({ limit: 200 });
  const { create, update } = useQrMutations();
  const [name, setName] = useState(qr?.name ?? '');
  const [mode, setMode] = useState<'link' | 'url'>(initialLink ? 'link' : 'url');
  const [linkId, setLinkId] = useState(initialLink ?? '');
  const [url, setUrl] = useState('');
  const [d, setD] = useState<QrDesign>(qr?.design ?? QrDesignSchema.parse({}));
  const set = <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => setD((x) => ({ ...x, [k]: v }));
  const chosen = links.data?.items.find((l) => l.id === linkId);
  useEffect(() => {
    if (!name && chosen) setName(chosen.title || `/${chosen.slug}`);
  }, [chosen, name]);
  const preview =
    qr?.encodedUrl ??
    (mode === 'link' && chosen ? `${chosen.shortUrl}?r=qr` : url || `${location.origin}/your-link`);
  const m = qr ? update : create;
  const fields = m.error instanceof ApiError ? m.error.fields : {};

  const save = () => {
    const ok = () => {
      toast(qr ? t('QR code saved') : t('QR code created'));
      onDone();
    };
    if (qr) update.mutate({ id: qr.id, name, design: d }, { onSuccess: ok });
    else create.mutate({ name, design: d, ...(mode === 'link' ? { linkId } : { url }) }, { onSuccess: ok });
  };
  const onLogo = async (file?: File) => {
    if (!file) return;
    const img = await createImageBitmap(file);
    const s = Math.min(1, 256 / Math.max(img.width, img.height));
    const c = Object.assign(document.createElement('canvas'), {
      width: Math.round(img.width * s),
      height: Math.round(img.height * s),
    });
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    set('logo', c.toDataURL('image/png'));
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <div className="grid content-start gap-5">
        {!qr && (
          <div className="grid gap-3">
            <Segmented
              label={t('Destination')}
              value={mode}
              onChange={setMode}
              options={[
                { value: 'url', label: t('New destination') },
                { value: 'link', label: t('One of my links') },
              ]}
            />
            {mode === 'url' ? (
              <Field
                label={t('Destination URL')}
                htmlFor="qr-url"
                error={fields.url}
                hint={t('A short link is created for it, so you can change the destination later.')}
              >
                <Input
                  id="qr-url"
                  type="url"
                  placeholder="https://"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  invalid={!!fields.url}
                />
              </Field>
            ) : (
              <Field label={t('Link')} htmlFor="qr-link">
                <Select id="qr-link" value={linkId} onChange={(e) => setLinkId(e.target.value)}>
                  <option value="">{t('Choose a link…')}</option>
                  {links.data?.items.map((l) => (
                    <option key={l.id} value={l.id}>
                      /{l.slug}
                      {l.title ? ` — ${l.title}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
        )}
        <Field label={t('Name')} htmlFor="qr-name" error={fields.name} hint={t('Only you see it.')}>
          <Input
            id="qr-name"
            placeholder={t('Shop window poster')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={!!fields.name}
          />
        </Field>

        <div className="grid gap-2">
          <span className="text-[13px] font-medium">{t('Colours')}</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                title={p.name}
                onClick={() => setD((x) => ({ ...x, ...p.d }))}
                className="size-9 rounded-lg ring-1 ring-line transition hover:scale-105"
                style={{
                  background: p.d.gradient
                    ? `linear-gradient(135deg, ${p.d.fg}, ${p.d.gradient.to})`
                    : p.d.fg,
                  boxShadow: `inset 0 0 0 4px ${p.d.bg}`,
                }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label={t('Code')} value={d.fg} onChange={(v) => set('fg', v)} />
            <ColorField label={t('Background')} value={d.bg} onChange={(v) => set('bg', v)} />
          </div>
          <Switch
            checked={!!d.gradient}
            onChange={(v) => set('gradient', v ? { to: '#3A5BFF', rotation: 45 } : null)}
            label={t('Gradient')}
          />
          {d.gradient && (
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label={t('Second colour')}
                value={d.gradient.to}
                onChange={(v) => set('gradient', { ...d.gradient!, to: v })}
              />
              <Field label={t('Angle')}>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={d.gradient.rotation}
                  onChange={(e) => set('gradient', { ...d.gradient!, rotation: Number(e.target.value) })}
                  className="accent-[var(--accent)]"
                />
              </Field>
            </div>
          )}
          {d.fg.toLowerCase() === d.bg.toLowerCase() && (
            <p className="text-[12.5px] text-coral">{t('Code and background need more contrast to scan.')}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Dots')}>
            <Select value={d.dots} onChange={(e) => set('dots', e.target.value as QrDesign['dots'])}>
              {QR_DOTS.map((x) => (
                <option key={x} value={x}>
                  {x.replace('-', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('Corners')}>
            <Select value={d.corners} onChange={(e) => set('corners', e.target.value as QrDesign['corners'])}>
              {QR_CORNERS.map((x) => (
                <option key={x} value={x}>
                  {x.replace('-', ' ')}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Frame')}>
            <Select value={d.frame} onChange={(e) => set('frame', e.target.value as QrDesign['frame'])}>
              {QR_FRAMES.map((x) => (
                <option key={x} value={x}>
                  {{ none: t('No frame'), label: t('Outline with label'), ticket: t('Solid ticket') }[x]}
                </option>
              ))}
            </Select>
          </Field>
          {d.frame !== 'none' && (
            <Field label={t('Frame text')}>
              <Input maxLength={24} value={d.frameText} onChange={(e) => set('frameText', e.target.value)} />
            </Field>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-line px-4 text-sm font-medium hover:bg-raised">
            <ImagePlus className="size-4" />
            {d.logo ? t('Replace logo') : t('Add a logo')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={(e) => onLogo(e.target.files?.[0])}
            />
          </label>
          {d.logo && (
            <button
              type="button"
              onClick={() => set('logo', null)}
              className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-coral"
            >
              <X className="size-3.5" />
              {t('Remove logo')}
            </button>
          )}
        </div>
      </div>

      <div className="grid content-start justify-items-center gap-4 md:sticky md:top-0">
        <div className="module-grid grid w-full place-items-center rounded-2xl p-6">
          <QrPreview data={preview} design={d} size={200} />
        </div>
        <p className="break-all text-center font-mono text-[11.5px] text-faint">{preview}</p>
        {m.error && !Object.keys(fields).length && (
          <p role="alert" className="text-[13px] text-coral">
            {m.error.message}
          </p>
        )}
        <Button
          className="w-full"
          loading={m.isPending}
          onClick={save}
          disabled={!qr && mode === 'link' && !linkId}
        >
          {qr ? t('Save changes') : t('Create QR code')}
        </Button>
        <div className="flex w-full gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => downloadQr(preview, d, name || 'qr-code', 'png')}
          >
            <Download className="size-3.5" />
            PNG
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => downloadQr(preview, d, name || 'qr-code', 'svg')}
          >
            <Download className="size-3.5" />
            SVG
          </Button>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
        <input
          value={value}
          onChange={(e) =>
            /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value.toUpperCase())
          }
          className={cx('w-full bg-transparent font-mono text-[13px] outline-none')}
          aria-label={`${label} hex`}
        />
      </div>
    </Field>
  );
}
