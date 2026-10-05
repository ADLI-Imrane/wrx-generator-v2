import { useEffect, useState } from 'react';
import { Download, ExternalLink, GripVertical, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { BIO_THEMES, BioInputSchema, OPEN_TO, PROFILE_KINDS, type BioInput, type BioPage } from '@wrx/shared';
import { ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useBioMutations, useBioPages } from '@/hooks/queries';
import {
  Button,
  CopyButton,
  Empty,
  ErrorState,
  Field,
  Input,
  ModuleLoader,
  PageHeader,
  Segmented,
  Select,
  Switch,
  Textarea,
  cx,
  useToast,
} from '@/components/ui';
import { ProfileView, THEMES } from '@/pages/public/ProfilePage';
import { useKindLabel, useOpenToLabel } from '@/pages/public/Discover';
import { downloadQr } from '@/components/QrPreview';

const blank = (): BioInput => ({
  ...BioInputSchema.parse({ handle: 'tmp', title: 'x' }),
  handle: '',
  title: '',
});

export default function ProfileEditor() {
  const { t } = useT();
  const pages = useBioPages();
  const [selected, setSelected] = useState<string | 'new' | null>(null);
  useEffect(() => {
    if (pages.data && selected === null) setSelected(pages.data.items[0]?.id ?? 'new');
  }, [pages.data, selected]);
  if (pages.error) return <ErrorState error={pages.error} />;
  if (!pages.data || selected === null) return <ModuleLoader />;
  const current = pages.data.items.find((p) => p.id === selected);
  return (
    <>
      <PageHeader
        title={t('Profile & card')}
        subtitle={t(
          'Your public page, QR business card and contact form. Startups and companies can create one page per brand.',
        )}
        actions={
          pages.data.items.length > 0 && (
            <div className="flex items-center gap-2">
              <Select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                aria-label={t('Profile')}
                className="w-auto"
              >
                {pages.data.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    @{p.handle}
                  </option>
                ))}
                <option value="new">{t('+ New page')}</option>
              </Select>
            </div>
          )
        }
      />
      {selected === 'new' && !pages.data.items.length && (
        <div className="mb-6">
          <Empty
            title={t('Create your profile')}
            body={t(
              'It takes two minutes. Choose whether you are a person, a startup or a company, and decide if you want to appear in the public directory.',
            )}
          />
        </div>
      )}
      <Editor key={selected} page={current} onCreated={(p) => setSelected(p.id)} />
    </>
  );
}

function Editor({ page, onCreated }: { page?: BioPage; onCreated: (p: BioPage) => void }) {
  const { t } = useT();
  const toast = useToast();
  const kinds = useKindLabel();
  const openLabels = useOpenToLabel();
  const { create, update, remove } = useBioMutations();
  const [f, setF] = useState<BioInput>(() => (page ? { ...page } : blank()));
  const [skills, setSkills] = useState((page?.skills ?? []).join(', '));
  const set = <K extends keyof BioInput>(k: K, v: BioInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const m = page ? update : create;
  const fields = m.error instanceof ApiError ? m.error.fields : {};
  const body = (): BioInput => ({
    ...f,
    skills: skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  });
  const publicUrl = `${location.origin}/b/${f.handle || 'your-name'}`;

  const save = () => {
    if (page) update.mutate({ id: page.id, ...body() }, { onSuccess: () => toast(t('Profile published')) });
    else
      create.mutate(body(), {
        onSuccess: (p) => {
          toast(t('Profile published'));
          onCreated(p);
        },
      });
  };
  const onAvatar = async (file?: File) => {
    if (!file) return;
    const img = await createImageBitmap(file);
    const s = Math.min(1, 320 / Math.max(img.width, img.height));
    const c = Object.assign(document.createElement('canvas'), {
      width: Math.round(img.width * s),
      height: Math.round(img.height * s),
    });
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    set('avatar', c.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <div className="grid content-start gap-6">
        <section className="card grid gap-4 p-5">
          <h2 className="text-[16px] font-semibold">{t('Who you are')}</h2>
          <Segmented
            label={t('Profile type')}
            value={f.kind}
            onChange={(v) => set('kind', v)}
            options={PROFILE_KINDS.map((k) => ({ value: k, label: kinds[k] }))}
          />
          <div className="flex items-center gap-4">
            <label className="grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-line text-faint hover:border-accent">
              {f.avatar ? (
                <img src={f.avatar} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-6" />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => onAvatar(e.target.files?.[0])}
                aria-label={t('Upload a photo or logo')}
              />
            </label>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field
                label={f.kind === 'person' ? t('Full name') : t('Name')}
                htmlFor="p-title"
                error={fields.title}
              >
                <Input
                  id="p-title"
                  value={f.title}
                  onChange={(e) => set('title', e.target.value)}
                  invalid={!!fields.title}
                />
              </Field>
              <Field label={t('Address')} htmlFor="p-handle" error={fields.handle}>
                <Input
                  id="p-handle"
                  className="font-mono"
                  leading={<span className="text-[12px]">/b/</span>}
                  value={f.handle}
                  onChange={(e) => set('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                  invalid={!!fields.handle}
                />
              </Field>
            </div>
          </div>
          <Field
            label={t('Headline')}
            htmlFor="p-headline"
            hint={
              f.kind === 'person'
                ? t('For example: Full-stack developer, React and Node.js')
                : t('For example: Online booking for clinics — seed stage')
            }
          >
            <Input
              id="p-headline"
              maxLength={100}
              value={f.headline}
              onChange={(e) => set('headline', e.target.value)}
            />
          </Field>
          <Field label={t('About')} htmlFor="p-bio" error={fields.bio}>
            <Textarea id="p-bio" maxLength={400} value={f.bio} onChange={(e) => set('bio', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('City or region')} htmlFor="p-loc">
              <Input
                id="p-loc"
                placeholder="Casablanca, Morocco"
                value={f.location}
                onChange={(e) => set('location', e.target.value)}
              />
            </Field>
            <Field label={t('Industry')} htmlFor="p-ind">
              <Input
                id="p-ind"
                placeholder={t('Software, health, logistics…')}
                value={f.industry}
                onChange={(e) => set('industry', e.target.value)}
              />
            </Field>
          </div>
          <Field
            label={f.kind === 'person' ? t('Skills') : t('Focus areas')}
            htmlFor="p-skills"
            hint={t('Separate with commas. People search the directory with these words.')}
          >
            <Input
              id="p-skills"
              placeholder="React, Node.js, Google Cloud"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </Field>
        </section>

        <section className="card grid gap-4 p-5">
          <h2 className="text-[16px] font-semibold">{t('What you are open to')}</h2>
          <div className="flex flex-wrap gap-2">
            {OPEN_TO.map((o) => {
              const on = f.openTo.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set('openTo', on ? f.openTo.filter((x) => x !== o) : [...f.openTo, o])}
                  className={cx(
                    'h-9 rounded-full border px-3.5 text-[13.5px] font-medium transition',
                    on
                      ? 'border-ink bg-ink text-white dark:border-accent dark:bg-accent dark:text-ink'
                      : 'border-line text-muted hover:text-fg',
                  )}
                >
                  {openLabels[o]}
                </button>
              );
            })}
          </div>
          <Switch
            checked={f.discoverable}
            onChange={(v) => set('discoverable', v)}
            label={t('Show me in the public directory')}
            description={t(
              'Your contact details stay hidden in the directory; people write to you through the contact form.',
            )}
          />
        </section>

        <section className="card grid gap-4 p-5">
          <h2 className="text-[16px] font-semibold">{t('Business card details')}</h2>
          <p className="-mt-2 text-[13px] text-muted">
            {t(
              'Saved into the phone of anyone who scans your card. Leave empty what you do not want to share.',
            )}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Email')} htmlFor="c-email" error={fields['card.email']}>
              <Input
                id="c-email"
                type="email"
                value={f.card.email ?? ''}
                onChange={(e) => set('card', { ...f.card, email: e.target.value })}
              />
            </Field>
            <Field label={t('Phone')} htmlFor="c-phone">
              <Input
                id="c-phone"
                type="tel"
                value={f.card.phone ?? ''}
                onChange={(e) => set('card', { ...f.card, phone: e.target.value })}
              />
            </Field>
            <Field label={t('Website')} htmlFor="c-web" error={fields['card.website']}>
              <Input
                id="c-web"
                type="url"
                placeholder="https://"
                value={f.card.website ?? ''}
                onChange={(e) => set('card', { ...f.card, website: e.target.value })}
              />
            </Field>
            <Field label={t('Role and company')} htmlFor="c-role">
              <Input
                id="c-role"
                placeholder={t('CTO at Rocket Labs')}
                value={f.card.role ?? ''}
                onChange={(e) => set('card', { ...f.card, role: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="card grid gap-3 p-5">
          <h2 className="text-[16px] font-semibold">{t('Links on your page')}</h2>
          {f.links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="size-4 shrink-0 text-faint" aria-hidden />
              <Input
                aria-label={t('Label')}
                placeholder={t('Label')}
                value={l.label}
                className="max-w-[200px]"
                onChange={(e) =>
                  set(
                    'links',
                    f.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                  )
                }
              />
              <Input
                aria-label="URL"
                type="url"
                placeholder="https://"
                value={l.url}
                invalid={!!fields[`links.${i}.url`]}
                onChange={(e) =>
                  set(
                    'links',
                    f.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                  )
                }
              />
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:text-coral"
                aria-label={t('Remove link')}
                onClick={() =>
                  set(
                    'links',
                    f.links.filter((_, j) => j !== i),
                  )
                }
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="justify-self-start"
            disabled={f.links.length >= 20}
            onClick={() => set('links', [...f.links, { label: '', url: '' }])}
          >
            <Plus className="size-4" />
            {t('Add a link')}
          </Button>
        </section>

        <section className="card grid gap-3 p-5">
          <h2 className="text-[16px] font-semibold">{t('Look')}</h2>
          <div className="flex flex-wrap gap-3">
            {BIO_THEMES.map((th) => (
              <button
                key={th}
                type="button"
                aria-pressed={f.theme === th}
                onClick={() => set('theme', th)}
                className={cx(
                  'h-16 w-24 rounded-xl ring-2 ring-offset-2 ring-offset-bg transition',
                  THEMES[th].page,
                  f.theme === th ? 'ring-accent' : 'ring-transparent',
                )}
              >
                <span className="text-[12px] font-semibold capitalize">{th}</span>
              </button>
            ))}
          </div>
        </section>

        {m.error && (
          <p role="alert" className="text-[13.5px] text-coral">
            {m.error.message}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="lg" loading={m.isPending} onClick={save}>
            {page ? t('Save and publish') : t('Publish my profile')}
          </Button>
          {page && (
            <>
              <a href={page.publicUrl} target="_blank" rel="noopener">
                <Button size="lg" variant="secondary">
                  <ExternalLink className="size-4" />
                  {t('Open')}
                </Button>
              </a>
              <CopyButton value={page.publicUrl} label={t('Copy link')} />
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-coral"
                onClick={() =>
                  confirm(t('Delete this page, its opportunities and its inbox?')) && remove.mutate(page.id)
                }
              >
                {t('Delete page')}
              </Button>
            </>
          )}
        </div>
      </div>

      <aside className="grid content-start gap-4 xl:sticky xl:top-6">
        <span className="text-[13px] font-medium text-muted">{t('Live preview')}</span>
        <div className="max-h-[70vh] overflow-y-auto rounded-[22px] shadow-[var(--shadow-lift)]">
          <ProfileView
            preview
            p={{
              ...body(),
              handle: f.handle || 'your-name',
              publicUrl,
              createdAt: '',
              openOpportunities: 0,
              opportunities: [],
              title: f.title || t('Your name'),
            }}
          />
        </div>
        {page && (
          <Button
            variant="secondary"
            onClick={() =>
              downloadQr(
                page.publicUrl,
                {
                  ...THEMES[f.theme].qr,
                  dots: 'rounded',
                  corners: 'extra-rounded',
                  frame: 'label',
                  frameText: f.title.slice(0, 24),
                  margin: 12,
                },
                `${f.handle}-card`,
                'png',
              )
            }
          >
            <Download className="size-4" />
            {t('Download my QR business card')}
          </Button>
        )}
      </aside>
    </div>
  );
}
