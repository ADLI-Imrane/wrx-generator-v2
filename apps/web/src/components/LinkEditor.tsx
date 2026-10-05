import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DEVICE_TARGETS, type Link, type LinkInput } from '@wrx/shared';
import { ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLinkMutations } from '@/hooks/queries';
import { Button, Field, Input, Select, Switch, cx, useToast } from './ui';

type Rule = LinkInput['rules'][number];
type Draft = {
  url: string;
  slug: string;
  title: string;
  tags: string;
  rules: Rule[];
  variants: LinkInput['variants'];
  utmOn: boolean;
  utm: NonNullable<LinkInput['utm']>;
  password: string;
  removePassword: boolean;
  expiresAt: string;
  maxClicks: string;
};

const fromLink = (l?: Link): Draft => ({
  url: l?.url ?? '',
  slug: l?.slug ?? '',
  title: l?.title ?? '',
  tags: l?.tags.join(', ') ?? '',
  rules: l?.rules ?? [],
  variants: l?.variants ?? [],
  utmOn: !!l?.utm,
  utm: l?.utm ?? {},
  password: '',
  removePassword: false,
  expiresAt: l?.expiresAt ? l.expiresAt.slice(0, 16) : '',
  maxClicks: l?.maxClicks ? String(l.maxClicks) : '',
});

/** Full link editor: destination, short name, routing rules, A/B split, UTM tags and access limits. */
export function LinkEditor({ link, onDone }: { link?: Link; onDone: (l: Link) => void }) {
  const { t } = useT();
  const toast = useToast();
  const { create, update } = useLinkMutations();
  const [d, setD] = useState<Draft>(() => fromLink(link));
  const [section, setSection] = useState<string | null>(
    link && (link.rules.length || link.variants.length) ? 'routing' : null,
  );
  const m = link ? update : create;
  const fields = m.error instanceof ApiError ? m.error.fields : {};
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const weight = d.variants.reduce((s, v) => s + v.weight, 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = {
      url: d.url.trim(),
      slug: d.slug.trim() || undefined,
      title: d.title.trim() || undefined,
      tags: d.tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      rules: d.rules,
      variants: d.variants,
      utm: d.utmOn ? Object.fromEntries(Object.entries(d.utm).filter(([, v]) => v)) : null,
      expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString() : null,
      maxClicks: d.maxClicks ? Number(d.maxClicks) : null,
      ...(d.password ? { password: d.password } : {}),
      ...(link && d.removePassword ? { removePassword: true } : {}),
    };
    const done = (l: Link) => {
      toast(link ? t('Link saved') : t('Link created — copied to your clipboard'));
      if (!link) navigator.clipboard?.writeText(l.shortUrl).catch(() => {});
      onDone(l);
    };
    if (link) update.mutate({ id: link.id, ...body }, { onSuccess: done });
    else create.mutate(body, { onSuccess: done });
  };

  const sec = { open: section, toggle: (id: string) => setSection(section === id ? null : id) };

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <Field label={t('Destination URL')} htmlFor="url" error={fields.url}>
        <Input
          id="url"
          type="url"
          placeholder="https://"
          value={d.url}
          onChange={(e) => set('url', e.target.value)}
          invalid={!!fields.url}
          autoFocus={!link}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t('Short name')}
          htmlFor="slug"
          error={fields.slug}
          hint={t('Leave empty for a random one.')}
        >
          <Input
            id="slug"
            className="font-mono"
            placeholder="spring-sale"
            value={d.slug}
            onChange={(e) => set('slug', e.target.value.replace(/\s+/g, '-'))}
            invalid={!!fields.slug}
          />
        </Field>
        <Field label={t('Title')} htmlFor="title">
          <Input
            id="title"
            placeholder={t('Spring campaign landing page')}
            value={d.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </Field>
      </div>
      <Field label={t('Tags')} htmlFor="tags" hint={t('Separate with commas.')}>
        <Input
          id="tags"
          placeholder="campaign, instagram"
          value={d.tags}
          onChange={(e) => set('tags', e.target.value)}
        />
      </Field>

      <div className="grid gap-2">
        <Section
          {...sec}
          id="routing"
          title={t('Smart routing')}
          summary={
            d.rules.length || d.variants.length
              ? t('{r} rules, {v} variants', { r: d.rules.length, v: d.variants.length })
              : t('Same page for everyone')
          }
        >
          <p className="text-[13px] text-muted">
            {t(
              'Rules are checked from top to bottom. The first one that matches wins; everyone else goes to the destination above.',
            )}
          </p>
          {d.rules.map((r, i) => (
            <div key={i} className="grid gap-2 rounded-[10px] bg-raised p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  className="w-auto"
                  value={r.type}
                  aria-label={t('Rule type')}
                  onChange={(e) =>
                    set(
                      'rules',
                      d.rules.map((x, j) =>
                        j === i
                          ? e.target.value === 'country'
                            ? { type: 'country', countries: ['MA'], url: x.url }
                            : { type: 'device', devices: ['ios'], url: x.url }
                          : x,
                      ),
                    )
                  }
                >
                  <option value="device">{t('If the visitor uses')}</option>
                  <option value="country">{t('If the visitor is in')}</option>
                </Select>
                {r.type === 'device' ? (
                  <div className="flex gap-1">
                    {DEVICE_TARGETS.map((dv) => (
                      <button
                        key={dv}
                        type="button"
                        onClick={() =>
                          set(
                            'rules',
                            d.rules.map((x, j) =>
                              j === i && x.type === 'device'
                                ? {
                                    ...x,
                                    devices: x.devices.includes(dv)
                                      ? x.devices.filter((y) => y !== dv)
                                      : [...x.devices, dv],
                                  }
                                : x,
                            ),
                          )
                        }
                        className={cx(
                          'h-9 rounded-lg px-3 text-[13px] font-medium',
                          r.devices.includes(dv)
                            ? 'bg-ink text-white dark:bg-accent dark:text-ink'
                            : 'bg-surface text-muted',
                        )}
                      >
                        {{ ios: 'iPhone / iPad', android: 'Android', desktop: t('Computer') }[dv]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input
                    className="w-48 font-mono uppercase"
                    placeholder="MA, FR, BE"
                    aria-label={t('Country codes')}
                    value={r.countries.join(', ')}
                    onChange={(e) =>
                      set(
                        'rules',
                        d.rules.map((x, j) =>
                          j === i && x.type === 'country'
                            ? {
                                ...x,
                                countries: e.target.value
                                  .toUpperCase()
                                  .split(/[\s,]+/)
                                  .filter(Boolean),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                )}
                <button
                  type="button"
                  onClick={() =>
                    set(
                      'rules',
                      d.rules.filter((_, j) => j !== i),
                    )
                  }
                  className="ml-auto grid size-9 place-items-center rounded-lg text-muted hover:text-coral"
                  aria-label={t('Remove rule')}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Input
                type="url"
                placeholder={t('send them to https://…')}
                aria-label={t('Rule destination')}
                value={r.url}
                onChange={(e) =>
                  set(
                    'rules',
                    d.rules.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                  )
                }
                invalid={!!fields[`rules.${i}.url`]}
              />
              {fields[`rules.${i}.url`] && (
                <p className="text-[12.5px] text-coral">{fields[`rules.${i}.url`]}</p>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="justify-self-start"
            onClick={() => set('rules', [...d.rules, { type: 'device', devices: ['ios'], url: '' }])}
          >
            <Plus className="size-4" />
            {t('Add a rule')}
          </Button>

          <div className="mt-2 grid gap-2 border-t border-line pt-4">
            <span className="font-medium">{t('A/B test')}</span>
            <p className="text-[13px] text-muted">
              {t(
                'Send a share of the remaining visitors to other pages and compare them in analytics. The main destination keeps {p}%.',
                { p: Math.max(0, 100 - weight) },
              )}
            </p>
            {d.variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://"
                  aria-label={t('Variant URL')}
                  value={v.url}
                  onChange={(e) =>
                    set(
                      'variants',
                      d.variants.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                    )
                  }
                />
                <Input
                  type="number"
                  min={1}
                  max={95}
                  className="w-24 tabular"
                  aria-label={t('Share of traffic in percent')}
                  value={v.weight}
                  onChange={(e) =>
                    set(
                      'variants',
                      d.variants.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)),
                    )
                  }
                />
                <span className="text-muted">%</span>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      'variants',
                      d.variants.filter((_, j) => j !== i),
                    )
                  }
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:text-coral"
                  aria-label={t('Remove variant')}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {fields.variants && <p className="text-[12.5px] text-coral">{fields.variants}</p>}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="justify-self-start"
              disabled={d.variants.length >= 5}
              onClick={() => set('variants', [...d.variants, { url: '', weight: 50 }])}
            >
              <Plus className="size-4" />
              {t('Add a variant')}
            </Button>
          </div>
        </Section>

        <Section
          {...sec}
          id="utm"
          title={t('Campaign tracking (UTM)')}
          summary={d.utmOn ? Object.values(d.utm).filter(Boolean).join(' / ') || t('On') : t('Off')}
        >
          <Switch
            checked={d.utmOn}
            onChange={(v) => set('utmOn', v)}
            label={t('Add UTM parameters')}
            description={t('Google Analytics and similar tools will attribute visits to this campaign.')}
          />
          {d.utmOn && (
            <div className="grid gap-3 sm:grid-cols-3">
              {(['source', 'medium', 'campaign'] as const).map((k) => (
                <Field key={k} label={k} htmlFor={`utm-${k}`}>
                  <Input
                    id={`utm-${k}`}
                    placeholder={{ source: 'instagram', medium: 'social', campaign: 'spring' }[k]}
                    value={d.utm[k] ?? ''}
                    onChange={(e) => set('utm', { ...d.utm, [k]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
          )}
        </Section>

        <Section
          {...sec}
          id="access"
          title={t('Access and limits')}
          summary={
            [
              link?.hasPassword || d.password ? t('Password') : '',
              d.expiresAt ? t('Expires') : '',
              d.maxClicks ? t('{n} clicks max', { n: d.maxClicks }) : '',
            ]
              .filter(Boolean)
              .join(', ') || t('Open to everyone')
          }
        >
          <Field
            label={link?.hasPassword ? t('New password') : t('Password')}
            htmlFor="pw"
            hint={
              link?.hasPassword
                ? t('This link already has a password. Type a new one to replace it.')
                : t('Visitors must type it before being redirected.')
            }
            error={fields.password}
          >
            <Input
              id="pw"
              type="password"
              autoComplete="new-password"
              value={d.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </Field>
          {link?.hasPassword && (
            <Switch
              checked={d.removePassword}
              onChange={(v) => set('removePassword', v)}
              label={t('Remove the password')}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Turn off after')} htmlFor="exp">
              <Input
                id="exp"
                type="datetime-local"
                value={d.expiresAt}
                onChange={(e) => set('expiresAt', e.target.value)}
              />
            </Field>
            <Field label={t('Maximum clicks')} htmlFor="max">
              <Input
                id="max"
                type="number"
                min={1}
                placeholder={t('Unlimited')}
                value={d.maxClicks}
                onChange={(e) => set('maxClicks', e.target.value)}
              />
            </Field>
          </div>
        </Section>
      </div>

      {m.error && !Object.keys(fields).length && (
        <p role="alert" className="text-[13.5px] text-coral">
          {m.error.message}
        </p>
      )}
      {m.error && Object.keys(fields).length > 0 && (
        <p role="alert" className="text-[13.5px] text-coral">
          {m.error.message}
        </p>
      )}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t border-line bg-surface px-5 py-4">
        <Button type="submit" loading={m.isPending}>
          {link ? t('Save changes') : t('Create link')}
        </Button>
      </div>
    </form>
  );
}

function Section({
  id,
  title,
  summary,
  children,
  open,
  toggle,
}: {
  id: string;
  title: string;
  summary: string;
  children: React.ReactNode;
  open: string | null;
  toggle: (id: string) => void;
}) {
  return (
    <div className="rounded-[12px] border border-line">
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-expanded={open === id}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-medium">{title}</span>
        <span className="truncate text-[13px] text-muted">{summary}</span>
      </button>
      {open === id && <div className="grid gap-4 border-t border-line p-4">{children}</div>}
    </div>
  );
}
