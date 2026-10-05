import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Contact, ExternalLink, Globe, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import type { Opportunity, PublicProfile } from '@wrx/shared';
import { api, ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button, Dialog, ModuleLoader, cx } from '@/components/ui';
import { QrPreview } from '@/components/QrPreview';
import { ContactForm } from '@/components/ContactForm';
import { Logo } from '@/components/Logo';
import { Avatar, OpportunityRow, kindIcon, useKindLabel, useOpenToLabel } from './Discover';
import NotFound from './NotFound';

export const THEMES = {
  ink: {
    page: 'bg-ink text-white',
    card: 'bg-white/[.06] ring-1 ring-white/12',
    link: 'bg-white text-ink hover:bg-signal',
    muted: 'text-white/65',
    qr: { fg: '#14213D', bg: '#FFFFFF' },
  },
  signal: {
    page: 'bg-signal text-ink',
    card: 'bg-white/55 ring-1 ring-ink/10',
    link: 'bg-ink text-white hover:bg-ink-2',
    muted: 'text-ink/70',
    qr: { fg: '#14213D', bg: '#FFF7DB' },
  },
  paper: {
    page: 'bg-paper text-ink',
    card: 'bg-white ring-1 ring-ink/8',
    link: 'bg-white text-ink ring-1 ring-ink/12 hover:ring-route',
    muted: 'text-ink/60',
    qr: { fg: '#14213D', bg: '#FFFFFF' },
  },
  route: {
    page: 'bg-route text-white',
    card: 'bg-white/10 ring-1 ring-white/20',
    link: 'bg-white text-route-deep hover:bg-signal hover:text-ink',
    muted: 'text-white/75',
    qr: { fg: '#2541D8', bg: '#FFFFFF' },
  },
} as const;

type Full = PublicProfile & { opportunities: Opportunity[] };

export default function ProfilePage() {
  const { handle = '' } = useParams();
  const q = useQuery({
    queryKey: ['public-bio', handle],
    queryFn: () => api<Full>(`/public/bio/${handle}`),
    retry: false,
  });
  if (q.isPending) return <ModuleLoader className="min-h-dvh" />;
  if (q.error instanceof ApiError && q.error.status === 404) return <NotFound />;
  if (!q.data) return <NotFound />;
  return <ProfileView p={q.data} />;
}

export function ProfileView({ p, preview }: { p: Full; preview?: boolean }) {
  const { t } = useT();
  const th = THEMES[p.theme];
  const kinds = useKindLabel();
  const open = useOpenToLabel();
  const [contact, setContact] = useState(false);
  const Icon = kindIcon[p.kind];
  const card = p.card ?? {};

  return (
    <div className={cx('min-h-full', th.page, preview ? 'rounded-[22px]' : 'min-h-dvh')}>
      <main className="mx-auto grid max-w-[640px] gap-6 px-5 py-12">
        <section className="grid justify-items-center gap-3 text-center">
          <Avatar src={p.avatar} name={p.title} kind={p.kind} size={96} />
          <h1 className="text-[32px] font-bold">{p.title}</h1>
          {p.headline && <p className={cx('text-[16px]', th.muted)}>{p.headline}</p>}
          <div className={cx('flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13.5px]', th.muted)}>
            <span className="inline-flex items-center gap-1">
              <Icon className="size-4" />
              {kinds[p.kind]}
              {p.industry && `, ${p.industry}`}
            </span>
            {p.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" />
                {p.location}
              </span>
            )}
          </div>
          {!!p.openTo.length && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {p.openTo.map((o) => (
                <Badge key={o} tone="signal" className="!bg-white/90 !text-ink">
                  {open[o]}
                </Badge>
              ))}
            </div>
          )}
          {p.bio && <p className={cx('max-w-[52ch] text-[15px] leading-relaxed', th.muted)}>{p.bio}</p>}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button variant="signal" onClick={() => setContact(true)} disabled={preview}>
              <MessageSquare className="size-4" />
              {t('Get in touch')}
            </Button>
            <a
              href={preview ? undefined : `/api/v1/public/bio/${p.handle}/vcard`}
              className={cx(
                'inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-medium',
                th.card,
              )}
            >
              <Contact className="size-4" />
              {t('Save contact')}
            </a>
          </div>
        </section>

        {!!p.links.length && (
          <section className="grid gap-2.5" aria-label={t('Links')}>
            {p.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener"
                className={cx(
                  'flex h-14 items-center justify-between rounded-2xl px-5 text-[15px] font-semibold transition',
                  th.link,
                )}
              >
                {l.label}
                <ExternalLink className="size-4 opacity-60" />
              </a>
            ))}
          </section>
        )}

        {!!p.skills.length && (
          <section className={cx('grid gap-3 rounded-2xl p-5', th.card)}>
            <h2 className="text-[16px] font-semibold">{p.kind === 'person' ? t('Skills') : t('Focus')}</h2>
            <div className="flex flex-wrap gap-1.5">
              {p.skills.map((s) => (
                <span key={s} className="rounded-full bg-white/80 px-3 py-1 text-[13px] font-medium text-ink">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {!!p.opportunities?.length && (
          <section className="grid gap-3">
            <h2 className="text-[18px] font-semibold">{t('Open opportunities')}</h2>
            <div className="grid gap-2 text-fg">
              {p.opportunities.map((o) => (
                <OpportunityRow key={o.id} o={o} />
              ))}
            </div>
          </section>
        )}

        {(card.email || card.phone || card.website) && (
          <section className={cx('grid gap-2 rounded-2xl p-5 text-[14px]', th.card)}>
            {card.email && (
              <a className="inline-flex items-center gap-2" href={`mailto:${card.email}`}>
                <Mail className="size-4" />
                {card.email}
              </a>
            )}
            {card.phone && (
              <a className="inline-flex items-center gap-2" href={`tel:${card.phone}`}>
                <Phone className="size-4" />
                {card.phone}
              </a>
            )}
            {card.website && (
              <a
                className="inline-flex items-center gap-2"
                href={card.website}
                target="_blank"
                rel="noopener"
              >
                <Globe className="size-4" />
                {card.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </section>
        )}

        <section className="grid justify-items-center gap-2 pt-4">
          <QrPreview
            data={p.publicUrl}
            size={140}
            design={{
              ...th.qr,
              dots: 'rounded',
              corners: 'extra-rounded',
              frame: 'none',
              frameText: '',
              margin: 8,
            }}
          />
          <p className={cx('text-[12.5px]', th.muted)}>{t('Scan to open this profile')}</p>
        </section>
        {!preview && (
          <Link to="/" className={cx('mx-auto opacity-80 hover:opacity-100', th.muted)}>
            <Logo className="text-[15px]" mono />
          </Link>
        )}
      </main>
      <Dialog
        open={contact}
        onClose={() => setContact(false)}
        title={t('Write to {name}', { name: p.title })}
      >
        <ContactForm
          handle={p.handle}
          defaultIntent={p.openTo.includes('hiring') ? 'job' : 'collaboration'}
        />
      </Dialog>
    </div>
  );
}
